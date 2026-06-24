import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wpinnuupeelvlzeyymsl.supabase.co";
const SUPABASE_KEY = "sb_publishable_tYtz6Yyvv-sJ4nMTdlsbAg_wkJcxaJz";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
