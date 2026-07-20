import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Rows3,
  BookOpen,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { mangaList } from "@/data/manga";
import { useReadingHistory } from "@/hooks/useReadingHistory";

const readerPages = [
  "https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=800&h=1200&fit=crop",
];

type Mode = "paged" | "vertical";

const MODE_KEY = "yuvience-reader-mode";

const Reader = () => {
  const { id, chapterId } = useParams();
  const navigate = useNavigate();
  const manga = mangaList.find((m) => m.id === id);
  const { markAsRead, getEntry } = useReadingHistory();

  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem(MODE_KEY) as Mode) || "paged"
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore last page on mount
  useEffect(() => {
    if (id && chapterId) {
      const entry = getEntry(id, Number(chapterId));
      if (entry?.lastPage !== undefined) setCurrentPage(entry.lastPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, chapterId]);

  // Save progress
  useEffect(() => {
    if (id && chapterId) {
      markAsRead(id, Number(chapterId), currentPage, readerPages.length);
    }
  }, [id, chapterId, currentPage, markAsRead]);

  // Preload next 3 images
  useEffect(() => {
    for (let i = 1; i <= 3; i++) {
      const next = readerPages[currentPage + i];
      if (next) {
        const img = new Image();
        img.src = next;
      }
    }
  }, [currentPage]);

  const prevPage = useCallback(
    () => setCurrentPage((p) => Math.max(0, p - 1)),
    []
  );
  const nextPage = useCallback(
    () => setCurrentPage((p) => Math.min(readerPages.length - 1, p + 1)),
    []
  );

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ignored */
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextPage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevPage();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) return; // browser handles
        navigate(`/manga/${id}`);
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(3, z + 0.25));
      } else if (e.key === "-") {
        setZoom((z) => Math.max(0.5, z - 0.25));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextPage, prevPage, toggleFullscreen, navigate, id]);

  // Vertical mode: track scroll -> update currentPage
  useEffect(() => {
    if (mode !== "vertical") return;
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const imgs = container.querySelectorAll("img[data-page]");
      const midY = container.scrollTop + container.clientHeight / 2;
      let best = 0;
      imgs.forEach((el) => {
        const img = el as HTMLImageElement;
        if (img.offsetTop <= midY) best = Number(img.dataset.page);
      });
      setCurrentPage(best);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [mode]);

  const switchMode = () => {
    const next: Mode = mode === "paged" ? "vertical" : "paged";
    setMode(next);
    localStorage.setItem(MODE_KEY, next);
    setZoom(1);
  };

  if (!manga) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Not found
      </div>
    );
  }

  return (
    <PageTransition>
      <div
        className="min-h-screen bg-background flex flex-col"
        onClick={() => setShowControls((s) => !s)}
      >
        {/* Top bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30 px-4 h-14 flex items-center justify-between gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                to={`/manga/${id}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-w-0"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline truncate">{manga.title}</span>
              </Link>
              <span className="text-sm font-medium shrink-0">Ch. {chapterId}</span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">
                  {currentPage + 1} / {readerPages.length}
                </span>
                <button
                  onClick={switchMode}
                  aria-label="Toggle reader mode"
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title={mode === "paged" ? "Switch to long strip" : "Switch to paged"}
                >
                  {mode === "paged" ? (
                    <Rows3 className="w-4 h-4" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={toggleFullscreen}
                  aria-label="Toggle fullscreen"
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reader body */}
        {mode === "paged" ? (
          <div className="flex-1 flex items-center justify-center py-16 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.25 }}
                className="max-h-[85vh] max-w-full overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={readerPages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  draggable={false}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: "transform 0.2s ease",
                  }}
                  className="max-h-[85vh] max-w-full object-contain rounded-lg select-none"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto pt-16 pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-3xl mx-auto flex flex-col gap-2 px-2">
              {readerPages.map((src, i) => (
                <motion.img
                  key={i}
                  data-page={i}
                  src={src}
                  alt={`Page ${i + 1}`}
                  loading={i > 2 ? "lazy" : "eager"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="w-full h-auto rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30 px-4 h-16 flex items-center justify-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {mode === "paged" ? (
                <>
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="p-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:hover:bg-secondary transition-all duration-300"
                    aria-label="Previous page"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="flex-1 max-w-xs h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full gradient-primary rounded-full"
                      animate={{
                        width: `${((currentPage + 1) / readerPages.length) * 100}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === readerPages.length - 1}
                    className="p-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:hover:bg-secondary transition-all duration-300"
                    aria-label="Next page"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="hidden sm:flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                      className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all"
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-muted-foreground w-10 text-center font-mono">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                      className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Long-strip mode · scroll to read · {currentPage + 1} / {readerPages.length}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Reader;
