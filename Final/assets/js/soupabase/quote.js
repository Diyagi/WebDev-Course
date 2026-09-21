import { supabase } from "./supaCliente.js";
import { applySearch, textSearchFilter } from "./search.js";
import { readPage } from "./pagination.js";

const QUOTE_SELECT = `
    id,
    clientid,
    userid,
    created_at,
    validity_days,
    finalized_at,
    total_value,
    client:clientid(id, name, cpf_cnpj, clienttype, phone, email),
    seller:userid(id, full_name, username),
    items:product_quote(
        id,
        quoteid,
        productid,
        description,
        amount,
        product_value,
        total_value,
        product:productid(id, description, price, status)
    )
`;

export async function getQuotes(search = "", options = {}) {
    const term = search.trim();
    const now = new Date();
    return readPage(() => {
        let query = supabase
            .from("quote")
            .select(QUOTE_SELECT + (term ? ",search_client:clientid(),search_seller:userid()" : ""));
        if (!options.showFinalized) query = query.is("finalized_at", null);
        if (term) {
            query = query
                .or(textSearchFilter(["name"], term), { referencedTable: "search_client" })
                .or(textSearchFilter(["full_name", "username"], term), { referencedTable: "search_seller" });
        }
        return applySearch(query, term, [], ["search_client.not.is.null", "search_seller.not.is.null"]);
    }, { ...options, sort: { key: "created_at", direction: "desc" } }, (quote) => {
        if (quote.finalized_at || options.showExpired || !quote.created_at) return true;
        const expiration = new Date(quote.created_at);
        expiration.setDate(expiration.getDate() + Number(quote.validity_days || 0));
        return !(expiration < now);
    });
}

export async function getQuote(quoteId) {
    return await supabase
        .from("quote")
        .select(QUOTE_SELECT)
        .eq("id", quoteId)
        .single();
}

export async function finalizeQuote(quoteId) {
    return await supabase
        .from("quote")
        .update({ finalized_at: new Date().toISOString() })
        .eq("id", quoteId)
        .is("finalized_at", null)
        .select("id, finalized_at")
        .single();
}

export async function createQuote(quote, items) {
    const { data, error } = await supabase
        .from("quote")
        .insert(quote)
        .select()
        .single();

    if (error || !data) return { data, error };

    const itemResult = await supabase
        .from("product_quote")
        .insert(items.map((item) => ({ ...item, quoteid: data.id })));

    if (itemResult.error) {
        // Avoid leaving an empty quote behind when its items could not be saved.
        await supabase.from("quote").delete().eq("id", data.id);
        return { data: null, error: itemResult.error };
    }

    return { data, error: null };
}

export async function updateQuote(quoteId, quote, items) {
    const { data, error } = await supabase
        .from("quote")
        .update(quote)
        .eq("id", quoteId)
        .select()
        .single();

    if (error) return { data, error };

    const existingItems = items.filter((item) => item.id);
    const newItems = items.filter((item) => !item.id);
    const keptIds = existingItems.map((item) => item.id);

    for (const item of existingItems) {
        const { id, ...values } = item;
        const result = await supabase
            .from("product_quote")
            .update({ ...values, quoteid: quoteId })
            .eq("id", id)
            .eq("quoteid", quoteId);
        if (result.error) return { data: null, error: result.error };
    }

    let deleteQuery = supabase.from("product_quote").delete().eq("quoteid", quoteId);
    if (keptIds.length) deleteQuery = deleteQuery.not("id", "in", `(${keptIds.join(",")})`);
    const deleteResult = await deleteQuery;
    if (deleteResult.error) return { data: null, error: deleteResult.error };

    if (newItems.length) {
        const result = await supabase
            .from("product_quote")
            .insert(newItems.map((item) => ({ ...item, quoteid: quoteId })));
        if (result.error) return { data: null, error: result.error };
    }

    return { data, error: null };
}

export async function deleteQuote(quoteId) {
    const itemResult = await supabase
        .from("product_quote")
        .delete()
        .eq("quoteid", quoteId);

    if (itemResult.error) return itemResult;

    return await supabase
        .from("quote")
        .delete()
        .eq("id", quoteId);
}

export async function reopenExpiredQuote(quoteId) {
    const { data: quote, error: quoteError } = await supabase
        .from("quote")
        .select("id, created_at, validity_days, finalized_at, product_quote(id, productid, amount)")
        .eq("id", quoteId)
        .single();

    if (quoteError || !quote) return { data: null, error: quoteError };

    const expiration = new Date(quote.created_at);
    expiration.setDate(expiration.getDate() + Number(quote.validity_days || 0));
    if (quote.finalized_at || expiration >= new Date()) {
        return { data: null, error: { code: "QUOTE_NOT_EXPIRED", message: "O orçamento não está vencido." } };
    }

    const items = quote.product_quote ?? [];
    const productIds = [...new Set(items.map((item) => item.productid))];
    const products = [];
    // Repricing needs every referenced price, fetched in bounded keyset pages.
    for (let start = 0; start < productIds.length; start += 100) {
        const ids = productIds.slice(start, start + 100);
        let cursor = null;
        do {
            const result = await readPage(() => supabase.from("product").select("id, price").in("id", ids), { cursor });
            if (result.error) return { data: null, error: result.error };
            products.push(...result.data);
            cursor = result.nextCursor;
        } while (cursor);
    }

    const prices = new Map((products ?? []).map((product) => [String(product.id), Number(product.price)]));
    const unavailableProduct = productIds.find((productId) => !prices.has(String(productId)) || !Number.isFinite(prices.get(String(productId))));
    if (unavailableProduct !== undefined) {
        return { data: null, error: { code: "PRODUCT_NOT_FOUND", message: `Produto ${unavailableProduct} indisponível.` } };
    }

    let totalValue = 0;
    for (const item of items) {
        const productValue = prices.get(String(item.productid));
        const itemTotal = roundMoney(Number(item.amount) * productValue);
        const { error } = await supabase
            .from("product_quote")
            .update({ product_value: productValue, total_value: itemTotal })
            .eq("id", item.id)
            .eq("quoteid", quoteId);
        if (error) return { data: null, error };
        totalValue += itemTotal;
    }

    return await supabase
        .from("quote")
        .update({
            created_at: new Date().toISOString(),
            finalized_at: null,
            total_value: roundMoney(totalValue)
        })
        .eq("id", quoteId)
        .select()
        .single();
}

function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
