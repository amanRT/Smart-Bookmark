"use client";

import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function DashboardClient() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formFocused, setFormFocused] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        setSessionReady(true);
      } else if (event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const fetchBookmarks = useCallback(async () => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Failed to load bookmarks.");
      return;
    }

    setBookmarks(data || []);
  }, [supabase]);

  useEffect(() => {
    if (!sessionReady) return;

    fetchBookmarks();

    const channel = supabase
      .channel("bookmarks-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        () => fetchBookmarks(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionReady, supabase, fetchBookmarks]);

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    setError(null);
    setAdding(true);

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([{ title, url: formattedUrl, user_id: user?.id }])
      .select();

    if (error) {
      setError("Failed to add bookmark.");
    } else if (data) {
      setBookmarks((prev) => [data[0], ...prev]);
      setTitle("");
      setUrl("");
    }

    setAdding(false);
  };

  const deleteBookmark = async (id: string) => {
    setError(null);
    setDeletingId(id);

    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      setError("Failed to delete bookmark.");
    } else {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    }

    setDeletingId(null);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!sessionReady) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            animation:
              "bounce-in 0.5s ease-out, glow-pulse 2s ease-in-out 0.5s infinite",
          }}
        >
          <svg
            className="w-7 h-7 text-white"
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
        <div
          className="flex items-center gap-2"
          style={{ animation: "fade-in 0.4s ease-out 0.3s both" }}
        >
          <div
            className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
            style={{ animation: "spin 0.7s linear infinite" }}
          />
          <span className="text-sm text-muted">Loading your bookmarks...</span>
        </div>
      </div>
    );
  }

  const userInitial =
    user?.user_metadata?.full_name?.[0] ||
    user?.email?.[0]?.toUpperCase() ||
    "U";
  const userName = user?.user_metadata?.full_name || user?.email || "User";
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-[100dvh] relative">
      {/* Subtle gradient orb */}
      <div
        className="pointer-events-none fixed top-[-200px] right-[-200px] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full opacity-15 blur-[80px] sm:blur-[120px]"
        style={{
          background: "radial-gradient(circle, #6366f1, transparent 70%)",
          animation: "orb-1 20s ease-in-out infinite",
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-10 backdrop-blur-xl border-b border-card-border safe-top"
        style={{
          background: "var(--card)",
          animation: "slide-down 0.4s ease-out",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                boxShadow: "0 2px 12px rgba(99, 102, 241, 0.25)",
              }}
            >
              <svg
                className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
              Smart Bookmark
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Avatar — visible on all sizes */}
            <div className="flex items-center gap-2 text-sm text-muted">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt=""
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-card-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white text-[10px] sm:text-xs font-bold flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  }}
                >
                  {userInitial}
                </div>
              )}
              <span className="hidden sm:block max-w-[140px] truncate font-medium">
                {userName}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-xs sm:text-sm text-muted hover:text-danger font-medium px-2.5 sm:px-3 py-2 rounded-lg sm:rounded-xl hover:bg-danger-light active:bg-danger-light min-h-[40px] flex items-center"
              style={{ transition: "all 0.25s ease" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 relative safe-bottom">
        {/* Add Bookmark Form */}
        <form
          onSubmit={addBookmark}
          onFocus={() => setFormFocused(true)}
          onBlur={() => setFormFocused(false)}
          className="backdrop-blur-xl border rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8"
          style={{
            background: "var(--card)",
            borderColor: formFocused
              ? "rgba(99, 102, 241, 0.3)"
              : "var(--card-border)",
            boxShadow: formFocused
              ? "0 8px 32px rgba(99, 102, 241, 0.08)"
              : "0 1px 3px rgba(0, 0, 0, 0.04)",
            animation: "fade-in-scale 0.4s ease-out",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
              }}
            >
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h2 className="text-xs sm:text-sm font-semibold">Add Bookmark</h2>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-background border border-input-border rounded-lg sm:rounded-xl text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-input-focus/20 focus:border-input-focus"
              style={{ transition: "all 0.25s ease" }}
              required
            />
            <input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="sm:flex-[2] px-3.5 sm:px-4 py-2.5 sm:py-3 bg-background border border-input-border rounded-lg sm:rounded-xl text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-input-focus/20 focus:border-input-focus"
              style={{ transition: "all 0.25s ease" }}
              required
            />
            <button
              type="submit"
              disabled={adding}
              className="text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 active:scale-[0.97] min-h-[44px]"
              style={{
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
                transition: "all 0.25s ease",
              }}
            >
              {adding ? (
                <div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  style={{ animation: "spin 0.6s linear infinite" }}
                />
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
              Add
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div
            className="border border-danger/20 text-danger px-3.5 sm:px-4 py-3 rounded-lg sm:rounded-xl mb-5 sm:mb-6 text-sm flex items-center gap-2 backdrop-blur-sm"
            style={{
              background: "var(--danger-light)",
              animation: "fade-in-scale 0.3s ease-out",
            }}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-danger/60 hover:text-danger p-1.5 rounded-lg hover:bg-danger/10 min-h-[36px] min-w-[36px] flex items-center justify-center"
              style={{ transition: "all 0.2s ease" }}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Bookmark Count */}
        <div
          className="flex items-center justify-between mb-4 sm:mb-5"
          style={{ animation: "fade-in 0.4s ease-out 0.1s both" }}
        >
          <h2 className="text-xs sm:text-sm font-semibold text-muted uppercase tracking-wider">
            Your Bookmarks
          </h2>
          <span
            className="text-[10px] sm:text-xs font-semibold bg-primary/10 text-primary px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full"
            style={{ animation: "count-up 0.3s ease-out 0.3s both" }}
          >
            {bookmarks.length} saved
          </span>
        </div>

        {/* Bookmarks List */}
        {bookmarks.length === 0 ? (
          <div
            className="backdrop-blur-xl border border-card-border rounded-xl sm:rounded-2xl p-10 sm:p-16 text-center"
            style={{
              background: "var(--card)",
              animation: "fade-in-scale 0.5s ease-out 0.2s both",
            }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl mb-4 sm:mb-5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))",
                animation: "float 4s ease-in-out infinite",
              }}
            >
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">
              No bookmarks yet
            </h3>
            <p className="text-muted text-xs sm:text-sm max-w-xs mx-auto">
              Add your first bookmark above and it will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:gap-2.5">
            {bookmarks.map((b, i) => (
              <div
                key={b.id}
                className="group relative backdrop-blur-xl border border-card-border rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-default active:scale-[0.995]"
                style={{
                  background: "var(--card)",
                  animation: `fade-in 0.35s ease-out ${i * 0.04}s both`,
                  transition:
                    "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 30px rgba(99, 102, 241, 0.08)";
                  e.currentTarget.style.borderColor =
                    "rgba(99, 102, 241, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--card-border)";
                }}
              >
                {/* Favicon */}
                <div
                  className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))",
                  }}
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${getDomain(b.url)}&sz=32`}
                    alt=""
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>

                {/* Content */}
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 block"
                >
                  <span
                    className="text-xs sm:text-sm font-semibold block truncate"
                    style={{ transition: "color 0.2s ease" }}
                  >
                    {b.title}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] sm:text-xs text-muted truncate">
                      {getDomain(b.url)}
                    </span>
                    <span className="text-muted/50 text-[10px] sm:text-xs">
                      ·
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted/70">
                      {getTimeAgo(b.created_at)}
                    </span>
                  </div>
                </a>

                {/* Actions — always visible on touch, hover on desktop */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="touch-show opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted hover:text-primary p-2 rounded-lg hover:bg-primary/10 active:bg-primary/10 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    style={{ transition: "all 0.2s ease" }}
                    title="Open link"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>

                  <button
                    onClick={() => deleteBookmark(b.id)}
                    disabled={deletingId === b.id}
                    className="touch-show opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted hover:text-danger p-2 rounded-lg hover:bg-danger-light active:bg-danger-light disabled:opacity-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    style={{ transition: "all 0.2s ease" }}
                    title="Delete bookmark"
                  >
                    {deletingId === b.id ? (
                      <div
                        className="w-4 h-4 border-2 border-danger/30 border-t-danger rounded-full"
                        style={{ animation: "spin 0.6s linear infinite" }}
                      />
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
