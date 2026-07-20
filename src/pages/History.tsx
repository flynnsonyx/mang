import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { History as HistoryIcon, Play, BookOpen, Flame, Trophy } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { mangaList } from "@/data/manga";

const timeAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const History = () => {
  const { getRecentlyRead, history } = useReadingHistory();
  const recent = getRecentlyRead(50);

  // Stats
  const totalChapters = new Set(
    history.map((e) => `${e.mangaId}:${e.chapterId}`)
  ).size;
  const uniqueSeries = new Set(history.map((e) => e.mangaId)).size;

  const genreCount: Record<string, number> = {};
  history.forEach((e) => {
    const m = mangaList.find((x) => x.id === e.mangaId);
    m?.genres.forEach((g) => (genreCount[g] = (genreCount[g] || 0) + 1));
  });
  const favoriteGenre =
    Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // Group by manga, keep latest chapter
  const grouped = new Map<string, typeof recent[number]>();
  recent.forEach((e) => {
    if (!grouped.has(e.mangaId)) grouped.set(e.mangaId, e);
  });
  const rows = Array.from(grouped.values());

  const stats = [
    { label: "Chapters Read", value: totalChapters, Icon: BookOpen },
    { label: "Series Started", value: uniqueSeries, Icon: Flame },
    { label: "Favorite Genre", value: favoriteGenre, Icon: Trophy },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4 pb-12">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-display font-bold mb-6"
          >
            <span className="gradient-text">Reading History</span>
          </motion.h1>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-xl p-4 border border-border/30"
              >
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                  <s.Icon className="w-4 h-4 text-primary" />
                  <span>{s.label}</span>
                </div>
                <div className="text-2xl font-display font-bold gradient-text truncate">
                  {s.value}
                </div>
              </motion.div>
            ))}
          </div>

          {rows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-4 animate-pulse-glow">
                <HistoryIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-display font-semibold mb-2">
                Nothing here yet
              </h2>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Chapters you read will show up here so you can pick up where you left off.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {rows.map((entry, i) => {
                const manga = mangaList.find((m) => m.id === entry.mangaId);
                if (!manga) return null;
                const progress =
                  entry.lastPage && entry.totalPages
                    ? Math.round(((entry.lastPage + 1) / entry.totalPages) * 100)
                    : null;
                return (
                  <motion.div
                    key={entry.mangaId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl p-3 flex items-center gap-4 border border-border/30 hover:border-primary/40 transition-all"
                  >
                    <Link to={`/manga/${manga.id}`} className="shrink-0">
                      <img
                        src={manga.cover}
                        alt={manga.title}
                        className="w-16 h-20 rounded-lg object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/manga/${manga.id}`}>
                        <h3 className="font-display font-semibold text-sm truncate hover:text-primary transition-colors">
                          {manga.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Chapter {entry.chapterId} · {timeAgo(entry.readAt)}
                      </p>
                      {progress !== null && (
                        <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/manga/${manga.id}/read/${entry.chapterId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold glow-md hover:glow-lg transition-all hover:scale-105 shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Resume
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default History;
