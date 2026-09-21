import { supabase } from "./supaCliente.js";
import { applySearch } from "./search.js";
import { readPage } from "./pagination.js";

// Creates a new category.
export async function createCategory(data) {
  return await supabase
    .from("category")
    .insert({ ...data })
    .select();
}

// Fetches the list of categories.
export async function getCategories(search = "", options = {}) {
  const sort = options.sort ?? { key: "id", direction: "asc" };
  if (!["id", "description"].includes(sort.key))
    throw new Error("Ordenação inválida.");
  return readPage(
    () =>
      applySearch(supabase.from("category").select(), search, ["description"]),
    { ...options, sort },
  );
}

// Fetches the category details by ID.
export async function getCategory(categoryId) {
  return await supabase.from("category").select().eq("id", categoryId).single();
}

// Updates the category details.
export async function updateCategory(categoryId, data) {
  return await supabase
    .from("category")
    .update({ ...data })
    .eq("id", categoryId);
}

// Deletes the specified category.
export async function deleteCategory(categoryId) {
  return await supabase.from("category").delete().eq("id", categoryId);
}
