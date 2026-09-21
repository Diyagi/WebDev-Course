import { supabase } from "./supaCliente.js";
import { applySearch, textSearchFilter } from "./search.js";
import { readPage } from "./pagination.js";

// Fetches the list of clients.
export async function getClients(search = "", options = {}) {
  const term = search.trim();
  const digits = term.replace(/\D/g, "");
  const documentFilter =
    digits && /^[\d\s()./+\-]+$/.test(term)
      ? [textSearchFilter(["cpf_cnpj", "phone"], digits)]
      : [];

  const sort = options.sort ?? { key: "id", direction: "asc" };
  if (!["id", "name", "cpf_cnpj", "phone", "email"].includes(sort.key))
    throw new Error("Ordenação inválida.");

  return readPage(
    () =>
      applySearch(
        supabase.from("client").select(),
        term,
        ["name", "cpf_cnpj", "phone", "email"],
        documentFilter,
      ),
    { ...options, sort },
  );
}

// Fetches the client details by ID.
export async function getClient(clientId) {
  return await supabase.from("client").select().eq("id", clientId).single();
}

// Creates a new client.
export async function createClient(data) {
  return await supabase.from("client").insert(data).select().single();
}

// Updates the client details.
export async function updateClient(clientId, data) {
  return await supabase
    .from("client")
    .update(data)
    .eq("id", clientId)
    .select()
    .single();
}

// Deletes the specified client.
export async function deleteClient(clientId) {
  return await supabase.from("client").delete().eq("id", clientId);
}
