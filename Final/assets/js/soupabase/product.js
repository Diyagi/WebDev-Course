import { supabase } from "./supaCliente.js";
import { applySearch, textSearchFilter } from "./search.js";
import { readPage } from "./pagination.js";

export async function getProducts(search = "", options = {}) {
    const term = search.trim();
    const sort = { ...(options.sort ?? { key: "id", direction: "asc" }) };
    if (!["id", "description", "price", "category"].includes(sort.key)) throw new Error("Ordenação inválida.");
    if (sort.key === "category") sort.related = { relation: "category", column: "description" };
    return readPage(() => {
        let query = supabase
        .from("product")
        .select("id, description, price, status, observation, created_at, category:categoryid(id, description)"
            + (term ? ",search_category:categoryid()" : "")
            + (sort.related ? ",cursor_after:categoryid(),cursor_equal:categoryid(),cursor_present:categoryid()" : ""));
        if (term) query = query.or(textSearchFilter(["description"], term), { referencedTable: "search_category" });
        if (options.activeOnly) query = query.or("status.ilike.active,status.ilike.ativo");
        if (options.excludeIds?.length) {
            const ids = options.excludeIds.map(Number);
            if (!ids.every((id) => Number.isSafeInteger(id) && id > 0)) throw new Error("ID inválido.");
            query = query.not("id", "in", `(${ids.join(",")})`);
        }
        return applySearch(query, term, ["description", "observation"], ["search_category.not.is.null"]);
    }, { ...options, sort });
}

export async function getProduct(productId) {
    return await supabase
        .from("product")
        .select("*, category:categoryid(id, description)")
        .eq("id", productId)
        .single();
}

export async function createProduct(data) {
    return await supabase
        .from("product")
        .insert(data)
        .select()
        .single();
}

export async function updateProduct(productId, data) {
    return await supabase
        .from("product")
        .update(data)
        .eq("id", productId)
        .select()
        .single();
}

export async function deleteProduct(productId) {
    return await supabase
        .from("product")
        .delete()
        .eq("id", productId);
}
