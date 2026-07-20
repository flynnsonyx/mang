import { useState, useCallback, useEffect } from "react";

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

export const useReadingHistory = () => {
  const [history, setHistory] = useState<ReadEntry[]>(loadHistory);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setHistory(loadHistory());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const markAsRead = useCallback(
    (mangaId: string, chapterId: number, lastPage?: number, totalPages?: number) => {
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
        } else {
          updated = [...prev, { mangaId, chapterId, readAt: now, lastPage, totalPages }];
        }
        saveHistory(updated);
        return updated;
      });
    },
    []
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

  return { history, markAsRead, isRead, getLastRead, getEntry, getRecentlyRead };
};
