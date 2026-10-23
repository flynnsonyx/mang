import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Star, X, Settings, ArrowLeft, BookOpen, Rows3 } from "lucide-react";
import { mangaList } from "@/data/manga";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const EDGE = 28; // px from right edge where a swipe can start

const SwipeRecommendations = () => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"recommendations" | "settings">("recommendations");
  const [readerMode, setReaderMode] = useState(() => localStorage.getItem("yuvience-reader-mode") || "paged");
  const [revealSpoilers, setRevealSpoilers] = useState(() => localStorage.getItem("yuvience-reveal-spoilers") === "1");
  const start = useRef<{ x: number; y: number } | null>(null);
  const location = useLocation();
  const { getRecentlyRead } = useReadingHistory();
  const inReader = location.pathname.includes("/read/");

  const { title, items } = useMemo(() => {
    const recent = getRecentlyRead(1)[0];
    const base = recent ? mangaList.find((m) => m.id === recent.mangaId) : null;
    if (base) {
      const list = mangaList
        .filter((m) => m.id !== base.id && m.genres.some((g) => base.genres.includes(g)))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8);
      if (list.length) return { title: `Because you read ${base.title}`, items: list };
    }
    return {
      title: "Trending picks for you",
      items: [...mangaList].sort((a, b) => b.popularity - a.popularity).slice(0, 8),
    };
  }, [getRecentlyRead]);

  useEffect(() => {
    setOpen(false);
    setView("recommendations");
  }, [location.pathname]);

  useEffect(() => {
    if (!open || view !== "settings") return;
    setRevealSpoilers(localStorage.getItem("yuvience-reveal-spoilers") === "1");
    setReaderMode(localStorage.getItem("yuvience-reader-mode") || "paged");
  }, [open, view]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);



  useEffect(() => {
    if (inReader) return;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || window.innerWidth >= 768) return;
      const insidePanel = e.target instanceof Element && !!e.target.closest('[data-swipe-preview]');
      start.current = (open ? insidePanel : t.clientX > window.innerWidth - EDGE) ? { x: t.clientX, y: t.clientY } : null;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      if (!t) { start.current = null; return; }
      const dx = start.current.x - t.clientX;
      const dy = Math.abs(start.current.y - t.clientY);
      if (dx > 50 && dx > dy) {
        setView(open ? "settings" : "recommendations");
        setOpen(true);
        setHint(false);
      }
      start.current = null;
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [inReader, open]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 80 || info.velocity.x > 500) setOpen(false);
  };

  if (inReader) return null;

  return (
    <>
      {/* First-visit hint (transient, non-interactive) */}
      <AnimatePresence>
        {hint && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="md:hidden fixed right-3 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex items-center gap-1.5 rounded-full glass border border-primary/30 py-1.5 pl-1 pr-2.5 text-primary shadow-lg"
          >
            <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-medium whitespace-nowrap">Swipe for picks</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={view === "settings" ? "Settings" : "Recommendations"}
              data-swipe-preview
              className="fixed right-0 top-0 bottom-0 z-50 w-[85%] max-w-sm glass border-l border-primary/30 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.6 }}
              onDragEnd={onDragEnd}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2 min-w-0">
                  {view === "settings" ? <Settings className="w-5 h-5 text-primary shrink-0" /> : <Sparkles className="w-5 h-5 text-primary shrink-0" />}
                  <h2 className="font-display font-bold gradient-text truncate">{view === "settings" ? "Settings" : title}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={view === "settings" ? "Back to recommendations" : "Open settings"}
                  onClick={() => setView(view === "settings" ? "recommendations" : "settings")}
                >
                  {view === "settings" ? <ArrowLeft /> : <Settings />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label={view === "settings" ? "Close settings" : "Close recommendations"}
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {view === "settings" ? (
                <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-y-auto p-4 space-y-8">
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Reading mode</h3>
                    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Default reading mode">
                      {(["paged", "vertical"] as const).map((mode) => (
                        <Button key={mode} variant={readerMode === mode ? "default" : "secondary"} aria-pressed={readerMode === mode} onClick={() => {
                          setReaderMode(mode);
                          localStorage.setItem("yuvience-reader-mode", mode);
                        }}>
                          {mode === "paged" ? <BookOpen /> : <Rows3 />}
                          {mode === "paged" ? "Pages" : "Scroll"}
                        </Button>
                      ))}
                    </div>
                  </section>
                  <section className="flex items-center justify-between gap-4">
                    <label htmlFor="preview-spoilers" className="text-sm font-semibold">Show spoilers</label>
                    <Switch id="preview-spoilers" checked={revealSpoilers} onCheckedChange={(checked) => {
                      setRevealSpoilers(checked);
                      localStorage.setItem("yuvience-reveal-spoilers", checked ? "1" : "0");
                      window.dispatchEvent(new Event("yuvience-spoiler-preference-changed"));
                    }} />
                  </section>
                </motion.div>
              ) : (
              <ul className="flex-1 overflow-y-auto p-3 space-y-3">
                {items.map((m, i) => (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i + 0.1 }}
                  >
                    <Link
                      to={`/manga/${m.id}`}
                      className="flex gap-3 p-2 rounded-xl hover:bg-primary/10 active:scale-[0.98] transition-all"
                    >
                      <img
                        src={m.cover}
                        alt={m.title}
                        loading="lazy"
                        className="w-16 h-22 aspect-[3/4] object-cover rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.genres.slice(0, 2).join(" · ")}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                          <Star className="w-3 h-3 fill-current" /> {m.rating}
                          <span className="text-muted-foreground ml-2">{m.status}</span>
                        </p>
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SwipeRecommendations;
