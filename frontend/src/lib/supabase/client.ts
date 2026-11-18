import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jealpcuawyjreewpizzo.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_nV_7K2cE5HQrAkjrhiXqDA_qH4V18tI";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export default supabase;
