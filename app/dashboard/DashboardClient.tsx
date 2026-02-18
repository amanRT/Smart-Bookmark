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
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-card-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
              <svg
                className="w-5 h-5 text-primary"
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
            <h1 className="text-lg font-bold tracking-tight">
              Smart Bookmark
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt=""
                  className="w-7 h-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {userInitial}
                </div>
              )}
              <span className="max-w-[150px] truncate">{userName}</span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-muted hover:text-danger transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-danger-light"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Add Bookmark Form */}
        <form
          onSubmit={addBookmark}
          className="bg-card border border-card-border rounded-2xl p-5 mb-8 shadow-sm"
          style={{ animation: "fade-in 0.3s ease-out" }}
        >
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            Add Bookmark
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-4 py-3 bg-background border border-input-border rounded-xl text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-input-focus/30 focus:border-input-focus transition-all"
              required
            />
            <input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-[2] px-4 py-3 bg-background border border-input-border rounded-xl text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-input-focus/30 focus:border-input-focus transition-all"
              required
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
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
                  strokeWidth={2}
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
            className="bg-danger-light border border-danger/20 text-danger px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2"
            style={{ animation: "fade-in 0.3s ease-out" }}
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
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-danger/60 hover:text-danger"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Bookmark Count */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Your Bookmarks
          </h2>
          <span className="text-xs text-muted bg-background px-2.5 py-1 rounded-full border border-card-border">
            {bookmarks.length} saved
          </span>
        </div>

        {/* Bookmarks List */}
        {bookmarks.length === 0 ? (
          <div
            className="bg-card border border-card-border rounded-2xl p-12 text-center shadow-sm"
            style={{ animation: "fade-in 0.4s ease-out" }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <svg
                className="w-8 h-8 text-primary"
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
            <h3 className="text-lg font-semibold mb-1">No bookmarks yet</h3>
            <p className="text-muted text-sm">
              Add your first bookmark above to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {bookmarks.map((b, i) => (
              <div
                key={b.id}
                className="group bg-card border border-card-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex items-center gap-4"
                style={{
                  animation: `fade-in 0.3s ease-out ${i * 0.05}s both`,
                }}
              >
                {/* Favicon */}
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${getDomain(b.url)}&sz=32`}
                    alt=""
                    className="w-5 h-5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:text-primary transition-colors block truncate"
                  >
                    {b.title}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted truncate">
                      {getDomain(b.url)}
                    </span>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-xs text-muted">
                      {getTimeAgo(b.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => deleteBookmark(b.id)}
                  disabled={deletingId === b.id}
                  className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted hover:text-danger hover:bg-danger-light p-2 rounded-lg transition-all disabled:opacity-50"
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
