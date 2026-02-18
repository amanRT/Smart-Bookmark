"use client";

import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

export default function Page() {
  const supabase = createBrowserSupabaseClient();
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // ✅ FIXED
      },
    });
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={loginWithGoogle}
        className="bg-black text-white px-6 py-3 rounded text-lg"
      >
        Login with Google
      </button>
    </div>
  );
}
