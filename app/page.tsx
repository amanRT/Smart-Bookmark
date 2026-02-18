"use client";

import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      }
    });
  }, [supabase, router]);

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getBaseUrl()}/auth/callback`,
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
