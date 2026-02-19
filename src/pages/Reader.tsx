import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { mangaList } from "@/data/manga";
import { useReadingHistory } from "@/hooks/useReadingHistory";

// Generate placeholder reader pages
const readerPages = [
  "https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=800&h=1200&fit=crop",
];

const Reader = () => {
  const { id, chapterId } = useParams();
  const manga = mangaList.find((m) => m.id === id);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const { markAsRead } = useReadingHistory();

  // Mark chapter as read when entering the reader
  useEffect(() => {
    if (id && chapterId) {
      markAsRead(id, Number(chapterId));
    }
  }, [id, chapterId, markAsRead]);

  if (!manga) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Not found
      </div>
    );
  }

  const prevPage = () => setCurrentPage((p) => Math.max(0, p - 1));
  const nextPage = () =>
    setCurrentPage((p) => Math.min(readerPages.length - 1, p + 1));

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
              className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30 px-4 h-14 flex items-center justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                to={`/manga/${id}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{manga.title}</span>
              </Link>
              <span className="text-sm font-medium">
                Chapter {chapterId}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentPage + 1} / {readerPages.length}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reader */}
        <div className="flex-1 flex items-center justify-center py-16">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentPage}
              src={readerPages[currentPage]}
              alt={`Page ${currentPage + 1}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.25 }}
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30 px-4 h-16 flex items-center justify-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="p-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:hover:bg-secondary transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Progress bar */}
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
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Reader;
