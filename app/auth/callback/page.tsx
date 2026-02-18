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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div
        className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
        style={{ animation: "spin 0.8s linear infinite" }}
      />
      <p className="text-muted text-sm font-medium">{status}</p>
    </div>
  );
}
