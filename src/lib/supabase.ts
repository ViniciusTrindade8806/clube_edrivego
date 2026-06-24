import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wjipjwtkwayknrkqbseo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaXBqd3Rrd2F5a25ya3Fic2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTA5MzUsImV4cCI6MjA5NzgyNjkzNX0.wzUJP9Nn5geWheOfgw5LchMp9orVXtEL8XGX0uz3vNc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
