import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tạo client
const supabaseEmail = createClient(
    import.meta.env.VITE_SUPABASE_URL_MAIL,
    import.meta.env.VITE_SUPABASE_ANON_KEY_MAIL
  );

// Hàm gọi action signup
export async function signup(name, email) {
    return await supabaseEmail.functions.invoke("swift-processor", {
      body: {
        action: "signup",
        name,
        email,
      },
    });
}
// Hàm gọi action reset password
export async function resetPassword(email) {
    return await supabaseEmail.functions.invoke("swift-processor", {
        body: {
          action: "resetPassword",
          email,
        },
    });
}
  
  