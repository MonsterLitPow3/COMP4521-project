import { SupabaseClient, createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://npueepcemjxvqlcfbbpx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdWVlcGNlbWp4dnFsY2ZiYnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODgyMjksImV4cCI6MjA3NzA2NDIyOX0.JLGX1XeFoggjRh55EU1rlOdbG7M-QUI_kGlaoA8-8LU";

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);