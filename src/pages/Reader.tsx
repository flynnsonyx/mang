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

  const focusRing =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const pageLabel = `Page ${currentPage + 1} of ${readerPages.length}`;

  return (
    <PageTransition>
      <div
        className="min-h-screen bg-background flex flex-col"
        onClick={() => setShowControls((s) => !s)}
        role="application"
        aria-label={`${manga.title} chapter ${chapterId} reader`}
      >
        {/* Screen-reader-only live region announcing page changes */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {pageLabel}
        </div>

        {/* Skip link for keyboard users */}
        <a
          href="#reader-content"
          className={`sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:font-semibold ${focusRing}`}
        >
          Skip to chapter content
        </a>

        {/* Top bar */}
        <AnimatePresence>
          {showControls && (
            <motion.header
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30 px-4 h-14 flex items-center justify-between gap-3"
              onClick={(e) => e.stopPropagation()}
              aria-label="Reader top toolbar"
            >
              <Link
                to={`/manga/${id}`}
                aria-label={`Back to ${manga.title} details`}
                className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-w-0 rounded-md px-1 ${focusRing}`}
              >
                <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline truncate">{manga.title}</span>
              </Link>
              <span className="text-sm font-medium shrink-0" aria-label={`Chapter ${chapterId}`}>
                Ch. {chapterId}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground mr-2 hidden sm:inline" aria-hidden="true">
                  {currentPage + 1} / {readerPages.length}
                </span>
                <button
                  onClick={switchMode}
                  aria-label={
                    mode === "paged"
                      ? "Switch to long-strip reader mode"
                      : "Switch to paged reader mode"
                  }
                  aria-pressed={mode === "vertical"}
                  className={`p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ${focusRing}`}
                >
                  {mode === "paged" ? (
                    <Rows3 className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
                <button
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  aria-pressed={isFullscreen}
                  className={`p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ${focusRing}`}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Maximize2 className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Reader body */}
        {mode === "paged" ? (
          <main
            id="reader-content"
            className="flex-1 flex items-center justify-center py-16 overflow-hidden"
            aria-label="Chapter pages, paged mode"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.25 }}
                className="max-h-[85vh] max-w-full overflow-auto"
                onClick={(e) => e.stopPropagation()}
                role="group"
                aria-roledescription="manga page"
                aria-label={pageLabel}
              >
                <img
                  src={readerPages[currentPage]}
                  alt={`${manga.title}, chapter ${chapterId}, page ${currentPage + 1} of ${readerPages.length}`}
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
          </main>
        ) : (
          <main
            id="reader-content"
            ref={scrollRef}
            className="flex-1 overflow-y-auto pt-16 pb-20"
            onClick={(e) => e.stopPropagation()}
            aria-label="Chapter pages, long-strip mode"
            tabIndex={0}
          >
            <div className="max-w-3xl mx-auto flex flex-col gap-2 px-2">
              {readerPages.map((src, i) => (
                <motion.img
                  key={i}
                  data-page={i}
                  src={src}
                  alt={`${manga.title}, chapter ${chapterId}, page ${i + 1} of ${readerPages.length}`}
                  loading={i > 2 ? "lazy" : "eager"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="w-full h-auto rounded-lg"
                />
              ))}
            </div>
          </main>
        )}

        {/* Keyboard shortcut hint for screen readers */}
        <p className="sr-only">
          Use left and right arrow keys to change pages. Press F for fullscreen.
          Press Escape to exit the reader. Use plus and minus keys to zoom.
        </p>

        {/* Bottom controls */}
        <AnimatePresence>
          {showControls && (
            <motion.nav
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30 px-4 h-16 flex items-center justify-center gap-4"
              onClick={(e) => e.stopPropagation()}
              aria-label="Page navigation"
            >
              {mode === "paged" ? (
                <>
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className={`p-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:hover:bg-secondary transition-all duration-300 ${focusRing}`}
                    aria-label="Previous page"
                  >
                    <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                  </button>

                  <div
                    className="flex-1 max-w-xs h-1.5 bg-secondary rounded-full overflow-hidden"
                    role="progressbar"
                    aria-label="Chapter progress"
                    aria-valuemin={0}
                    aria-valuemax={readerPages.length}
                    aria-valuenow={currentPage + 1}
                    aria-valuetext={pageLabel}
                  >
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
                    className={`p-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:hover:bg-secondary transition-all duration-300 ${focusRing}`}
                    aria-label="Next page"
                  >
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </button>

                  <div className="hidden sm:flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                      className={`p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all ${focusRing}`}
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <span
                      className="text-xs text-muted-foreground w-10 text-center font-mono"
                      aria-label={`Zoom ${Math.round(zoom * 100)} percent`}
                    >
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                      className={`p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all ${focusRing}`}
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground" aria-live="polite">
                  Long-strip mode · scroll to read · {currentPage + 1} / {readerPages.length}
                </div>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Reader;
