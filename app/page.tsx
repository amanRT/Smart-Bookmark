"use client";

import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [supabase, router]);

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getBaseUrl()}/auth/callback`,
      },
    });
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-5 sm:px-6 py-10 sm:py-12 overflow-hidden">
      {/* Animated gradient orbs — smaller on mobile */}
      <div
        className="pointer-events-none absolute top-[-20%] left-[-10%] w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] rounded-full opacity-30 blur-[80px] sm:blur-[100px]"
        style={{
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          animation: "orb-1 15s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[-15%] right-[-10%] w-[220px] sm:w-[400px] h-[220px] sm:h-[400px] rounded-full opacity-25 blur-[80px] sm:blur-[100px]"
        style={{
          background: "radial-gradient(circle, #a855f7 0%, transparent 70%)",
          animation: "orb-2 18s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute top-[30%] right-[10%] w-[180px] sm:w-[300px] h-[180px] sm:h-[300px] rounded-full opacity-20 blur-[60px] sm:blur-[80px]"
        style={{
          background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
          animation: "orb-3 20s ease-in-out infinite",
        }}
      />

      <div className="relative w-full max-w-md z-10">
        {/* Logo & Title */}
        <div
          className="text-center mb-6 sm:mb-8"
          style={{ animation: "fade-in 0.6s ease-out" }}
        >
          <div
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl mb-4 sm:mb-5"
            style={{
              background:
                "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)",
              backgroundSize: "200% 200%",
              animation:
                "float 4s ease-in-out infinite, gradient-shift 6s ease infinite",
              boxShadow: "0 8px 32px rgba(99, 102, 241, 0.3)",
            }}
          >
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-white"
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
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, var(--foreground) 0%, var(--muted) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Smart Bookmark
          </h1>
          <p
            className="text-muted mt-2 sm:mt-3 text-sm sm:text-base px-4 sm:px-0"
            style={{ animation: "fade-in 0.6s ease-out 0.15s both" }}
          >
            Save, organize, and access your bookmarks anywhere
          </p>
        </div>

        {/* Card */}
        <div
          className="backdrop-blur-xl border border-card-border rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8"
          style={{
            background: "var(--card)",
            animation: "fade-in-scale 0.5s ease-out 0.2s both",
          }}
        >
          <button
            onClick={handleGoogle}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className="group relative w-full flex items-center justify-center gap-3 text-foreground font-semibold py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl sm:rounded-2xl overflow-hidden active:scale-[0.98]"
            style={{
              background: hovering
                ? "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)"
                : "var(--card-solid)",
              border: "1px solid var(--card-border)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: hovering ? "translateY(-2px)" : "translateY(0)",
              boxShadow: hovering
                ? "0 12px 40px rgba(99, 102, 241, 0.15)"
                : "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(99,102,241,0.05), transparent)",
                backgroundSize: "200% 100%",
                animation: hovering ? "shimmer 2s linear infinite" : "none",
                transition: "opacity 0.3s",
              }}
            />
            <svg className="relative w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="relative text-sm sm:text-base">
              Continue with Google
            </span>
            <svg
              className="relative w-4 h-4 text-muted hidden sm:block"
              style={{
                transition: "transform 0.3s ease",
                transform: hovering ? "translateX(4px)" : "translateX(0)",
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <p
            className="text-center text-muted text-[11px] sm:text-xs mt-4 sm:mt-5"
            style={{ animation: "fade-in 0.5s ease-out 0.4s both" }}
          >
            New users are automatically signed up
          </p>
        </div>

        {/* Features */}
        <div
          className="grid grid-cols-3 gap-2 sm:gap-3 mt-6 sm:mt-8"
          style={{ animation: "fade-in 0.5s ease-out 0.5s both" }}
        >
          {[
            { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Instant sync" },
            {
              icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
              label: "Secure",
            },
            {
              icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
              label: "Anywhere",
            },
          ].map((f, i) => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl sm:rounded-2xl text-center"
              style={{
                animation: `slide-up 0.4s ease-out ${0.6 + i * 0.1}s both`,
              }}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-card backdrop-blur-sm border border-card-border flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={f.icon}
                  />
                </svg>
              </div>
              <span className="text-[10px] sm:text-[11px] text-muted font-medium">
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
