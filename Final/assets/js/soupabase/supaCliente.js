import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://qevlienpokgsyfwtqpjc.supabase.co";
const SUPABASE_ANOM_KEY = "sb_publishable_f6q1QVCpFX0UZIVDYQOl3A_e51JUwZx";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANOM_KEY);
