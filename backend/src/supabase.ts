import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || "";

if (!supabaseUrl || !supabaseSecretKey) {
  console.warn("WARNING: Supabase URL or Secret Key are missing in the .env file.");
}

// Initialize Supabase Client with the secret key to bypass RLS for medical report uploads
export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false
  }
});
