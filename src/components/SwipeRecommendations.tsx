import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Star, X, ChevronLeft } from "lucide-react";
import { mangaList } from "@/data/manga";
import { useReadingHistory } from "@/hooks/useReadingHistory";

const EDGE = 28; // px from right edge where a swipe can start
const HINT_KEY = "yuvience-swipe-hint-seen";

const SwipeRecommendations = () => {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
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

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (inReader) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    if (mobile.matches && !localStorage.getItem(HINT_KEY)) {
      setHint(true);
      const t = setTimeout(() => setHint(false), 4500);
      localStorage.setItem(HINT_KEY, "1");
      return () => clearTimeout(t);
    }
  }, [inReader]);

  useEffect(() => {
    if (inReader) return;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (window.innerWidth >= 768) return;
      start.current = t.clientX > window.innerWidth - EDGE ? { x: t.clientX, y: t.clientY } : null;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = start.current.x - t.clientX;
      const dy = Math.abs(start.current.y - t.clientY);
      if (dx > 50 && dx > dy) {
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
  }, [inReader]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 80 || info.velocity.x > 500) setOpen(false);
  };

  if (inReader) return null;

  return (
    <>
      {/* Edge tab / hint */}
      <motion.button
        type="button"
        aria-label="Open recommendations"
        onClick={() => setOpen(true)}
        className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1 rounded-l-xl glass border border-primary/30 border-r-0 py-3 pl-1.5 pr-1 text-primary shadow-lg"
        animate={hint ? { x: [0, -10, 0] } : { x: 0 }}
        transition={hint ? { repeat: Infinity, duration: 1.2 } : {}}
      >
        <ChevronLeft className="w-4 h-4" />
        <AnimatePresence>
          {hint && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="text-xs font-medium whitespace-nowrap overflow-hidden pr-1"
            >
              Swipe for picks
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

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
              aria-label="Recommendations"
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
                  <Sparkles className="w-5 h-5 text-primary shrink-0" />
                  <h2 className="font-display font-bold gradient-text truncate">{title}</h2>
                </div>
                <button
                  type="button"
                  aria-label="Close recommendations"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
              <p className="text-center text-xs text-muted-foreground p-3">Swipe right to close</p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SwipeRecommendations;
