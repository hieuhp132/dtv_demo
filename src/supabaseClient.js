import { createClient } from "@supabase/supabase-js";

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// second client = functions only (NO auth)
const supabaseEmail = createClient(
  import.meta.env.VITE_SUPABASE_URL_MAIL,
  import.meta.env.VITE_SUPABASE_ANON_KEY_MAIL,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: undefined,
    }
  }
);

// calls
export function signup(name, email) {
  return supabaseEmail.functions.invoke("swift-processor", {
    body: { action: "signup", name, email },
  });
}

export function resetPassword(email) {
  return supabaseEmail.functions.invoke("swift-processor", {
    body: { action: "resetPassword", email },
  });
}

export function signInWithProvider(provider) {
  const providerMap = { linkedin: "linkedin_oidc" };
  const p = providerMap[provider] || provider;
  return supabase.auth.signInWithOAuth({ provider: p });
}

export async function getSupabaseSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}
