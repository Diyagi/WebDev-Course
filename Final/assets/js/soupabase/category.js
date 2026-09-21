import { supabase } from "./supaCliente.js";
import { applySearch } from "./search.js";
import { readPage } from "./pagination.js";

export async function createCategory(data) {
    return await supabase
        .from("category")
        .insert({...data})
        .select();
}

export async function getCategories(search = "", options = {}) {
    const sort = options.sort ?? { key: "id", direction: "asc" };
    if (!["id", "description"].includes(sort.key)) throw new Error("Ordenação inválida.");
    return readPage(() => applySearch(supabase.from("category").select(), search, ["description"]), { ...options, sort });
}

export async function getCategory(categoryId) {
    return await supabase
        .from("category")
        .select()
        .eq("id", categoryId)
        .single();
}

export async function updateCategory(categoryId, data) {
    return await supabase
        .from("category")
        .update({...data})
        .eq("id", categoryId);
}

export async function deleteCategory(categoryId) {
    return await supabase
        .from("category")
        .delete()
        .eq("id", categoryId);
}
