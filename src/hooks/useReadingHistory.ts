import { useState, useCallback, useEffect } from "react";

export interface ReadEntry {
  mangaId: string;
  chapterId: number;
  readAt: number; // timestamp
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

export const useReadingHistory = () => {
  const [history, setHistory] = useState<ReadEntry[]>(loadHistory);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setHistory(loadHistory());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const markAsRead = useCallback((mangaId: string, chapterId: number) => {
    setHistory((prev) => {
      const exists = prev.some(
        (e) => e.mangaId === mangaId && e.chapterId === chapterId
      );
      if (exists) {
        // Update timestamp
        const updated = prev.map((e) =>
          e.mangaId === mangaId && e.chapterId === chapterId
            ? { ...e, readAt: Date.now() }
            : e
        );
        saveHistory(updated);
        return updated;
      }
      const updated = [...prev, { mangaId, chapterId, readAt: Date.now() }];
      saveHistory(updated);
      return updated;
    });
  }, []);

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

  const getRecentlyRead = useCallback(
    (limit = 10) =>
      [...history].sort((a, b) => b.readAt - a.readAt).slice(0, limit),
    [history]
  );

  return { history, markAsRead, isRead, getLastRead, getRecentlyRead };
};
