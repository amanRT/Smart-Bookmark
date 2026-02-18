"use client";

import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
}

export default function DashboardClient() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
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
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
        },
        () => {
          fetchBookmarks();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionReady, supabase, fetchBookmarks]);

  const addBookmark = async () => {
    if (!title || !url) return;

    setError(null);

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([{ title, url: formattedUrl, user_id: userId }])
      .select();

    if (error) {
      setError("Failed to add bookmark.");
      return;
    }

    if (data) setBookmarks((prev) => [data[0], ...prev]);

    setTitle("");
    setUrl("");
  };

  const deleteBookmark = async (id: string) => {
    setError(null);

    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      setError("Failed to delete bookmark.");
      return;
    }

    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">My Bookmarks</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border px-3 py-2 w-1/3 rounded"
        />

        <input
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border px-3 py-2 w-2/3 rounded"
        />

        <button
          onClick={addBookmark}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      <div className="grid gap-3">
        {bookmarks.map((b) => (
          <div key={b.id} className="flex justify-between border p-3 rounded">
            <a href={b.url} target="_blank" className="text-blue-600">
              {b.title}
            </a>
            <button
              onClick={() => deleteBookmark(b.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
