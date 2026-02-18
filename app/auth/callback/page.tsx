"use client";

import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

export default function AuthCallback() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.location.href = "/dashboard";
      }
      if (event === "INITIAL_SESSION" && !session) {
        setStatus("Authentication failed. Redirecting...");
        window.location.href = "/";
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-lg">{status}</p>
    </div>
  );
}
