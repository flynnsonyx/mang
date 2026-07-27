import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "yuvience-bookmarks";

const load = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const save = (ids: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<string[]>(load);
  const { user } = useAuth();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setBookmarks(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Sync with the cloud when signed in: merge local + remote, then persist both.
  useEffect(() => {
    if (!user) {
      syncedFor.current = null;
      return;
    }
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;

    (async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("manga_id")
        .eq("user_id", user.id);
      if (error) return;

      const remote = (data ?? []).map((r) => r.manga_id);
      const local = load();
      const merged = Array.from(new Set([...remote, ...local]));
      const missing = local.filter((id) => !remote.includes(id));

      if (missing.length > 0) {
        await supabase
          .from("bookmarks")
          .upsert(
            missing.map((manga_id) => ({ user_id: user.id, manga_id })),
            { onConflict: "user_id,manga_id" }
          );
      }

      save(merged);
      setBookmarks(merged);
    })();
  }, [user]);

  const isBookmarked = useCallback(
    (id: string) => bookmarks.includes(id),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (id: string) => {
      let added = false;
      setBookmarks((prev) => {
        added = !prev.includes(id);
        const next = added ? [...prev, id] : prev.filter((b) => b !== id);
        save(next);
        return next;
      });

      if (user) {
        // Fire-and-forget cloud write; local state is the source of truth for UI.
        setTimeout(async () => {
          if (added) {
            await supabase
              .from("bookmarks")
              .upsert(
                { user_id: user.id, manga_id: id },
                { onConflict: "user_id,manga_id" }
              );
          } else {
            await supabase
              .from("bookmarks")
              .delete()
              .eq("user_id", user.id)
              .eq("manga_id", id);
          }
        }, 0);
      }
    },
    [user]
  );

  return { bookmarks, isBookmarked, toggleBookmark, isSynced: !!user };
};
