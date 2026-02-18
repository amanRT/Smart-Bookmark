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
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden">
      {/* Background orb */}
      <div
        className="pointer-events-none absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[100px]"
        style={{
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          animation: "orb-1 12s ease-in-out infinite",
        }}
      />

      <div
        className="relative"
        style={{ animation: "bounce-in 0.6s ease-out" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            animation: "glow-pulse 2s ease-in-out infinite",
          }}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
      </div>

      <div style={{ animation: "fade-in 0.5s ease-out 0.3s both" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 border-[2.5px] border-primary/30 border-t-primary rounded-full"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
          <p className="text-muted text-sm font-medium">{status}</p>
        </div>
      </div>
    </div>
  );
}
