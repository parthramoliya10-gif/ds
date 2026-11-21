import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lizeeltvkkmtyiwcoyvs.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpemVlbHR2a2ttdHlpd2NveXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyMzg0MzYsImV4cCI6MjExMDgxNDQzNn0.TfXz1RnAUroOttUgL0Q47cJ5lz7OdRJrE5u0e0xrK90";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export default supabase;
