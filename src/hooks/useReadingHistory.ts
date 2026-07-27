import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ReadEntry {
  mangaId: string;
  chapterId: number;
  readAt: number;
  lastPage?: number;
  totalPages?: number;
}

const STORAGE_KEY = "yuvience-reading-history";

const loadHistory = (): ReadEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistory = (entries: ReadEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const keyOf = (e: { mangaId: string; chapterId: number }) =>
  `${e.mangaId}::${e.chapterId}`;

export const useReadingHistory = () => {
  const [history, setHistory] = useState<ReadEntry[]>(loadHistory);
  const { user } = useAuth();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setHistory(loadHistory());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Merge local + cloud history on sign-in, keeping the most recent entry per chapter.
  useEffect(() => {
    if (!user) {
      syncedFor.current = null;
      return;
    }
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;

    (async () => {
      const { data, error } = await supabase
        .from("reading_history")
        .select("manga_id, chapter_id, last_page, total_pages, read_at")
        .eq("user_id", user.id);
      if (error) return;

      const remote: ReadEntry[] = (data ?? []).map((r) => ({
        mangaId: r.manga_id,
        chapterId: r.chapter_id,
        lastPage: r.last_page ?? undefined,
        totalPages: r.total_pages ?? undefined,
        readAt: new Date(r.read_at).getTime(),
      }));

      const map = new Map<string, ReadEntry>();
      for (const e of [...remote, ...loadHistory()]) {
        const existing = map.get(keyOf(e));
        if (!existing || e.readAt > existing.readAt) map.set(keyOf(e), e);
      }
      const merged = [...map.values()];

      const remoteMap = new Map(remote.map((e) => [keyOf(e), e]));
      const toPush = merged.filter((e) => {
        const r = remoteMap.get(keyOf(e));
        return !r || e.readAt > r.readAt;
      });

      if (toPush.length > 0) {
        await supabase.from("reading_history").upsert(
          toPush.map((e) => ({
            user_id: user.id,
            manga_id: e.mangaId,
            chapter_id: e.chapterId,
            last_page: e.lastPage ?? null,
            total_pages: e.totalPages ?? null,
            read_at: new Date(e.readAt).toISOString(),
          })),
          { onConflict: "user_id,manga_id,chapter_id" }
        );
      }

      saveHistory(merged);
      setHistory(merged);
    })();
  }, [user]);

  const markAsRead = useCallback(
    (mangaId: string, chapterId: number, lastPage?: number, totalPages?: number) => {
      let saved: ReadEntry | null = null;
      setHistory((prev) => {
        const idx = prev.findIndex(
          (e) => e.mangaId === mangaId && e.chapterId === chapterId
        );
        const now = Date.now();
        let updated: ReadEntry[];
        if (idx >= 0) {
          updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            readAt: now,
            lastPage: lastPage ?? updated[idx].lastPage,
            totalPages: totalPages ?? updated[idx].totalPages,
          };
          saved = updated[idx];
        } else {
          saved = { mangaId, chapterId, readAt: now, lastPage, totalPages };
          updated = [...prev, saved];
        }
        saveHistory(updated);
        return updated;
      });

      if (user) {
        setTimeout(async () => {
          if (!saved) return;
          await supabase.from("reading_history").upsert(
            {
              user_id: user.id,
              manga_id: saved.mangaId,
              chapter_id: saved.chapterId,
              last_page: saved.lastPage ?? null,
              total_pages: saved.totalPages ?? null,
              read_at: new Date(saved.readAt).toISOString(),
            },
            { onConflict: "user_id,manga_id,chapter_id" }
          );
        }, 0);
      }
    },
    [user]
  );

  const isRead = useCallback(
    (mangaId: string, chapterId: number) =>
      history.some((e) => e.mangaId === mangaId && e.chapterId === chapterId),
    [history]
  );

  const getLastRead = useCallback(
    (mangaId: string): ReadEntry | undefined =>
      history
        .filter((e) => e.mangaId === mangaId)
        .sort((a, b) => b.readAt - a.readAt)[0],
    [history]
  );

  const getEntry = useCallback(
    (mangaId: string, chapterId: number) =>
      history.find((e) => e.mangaId === mangaId && e.chapterId === chapterId),
    [history]
  );

  const getRecentlyRead = useCallback(
    (limit = 20) =>
      [...history].sort((a, b) => b.readAt - a.readAt).slice(0, limit),
    [history]
  );

  return {
    history,
    markAsRead,
    isRead,
    getLastRead,
    getEntry,
    getRecentlyRead,
    isSynced: !!user,
  };
};
