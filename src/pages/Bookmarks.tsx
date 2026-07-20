import { motion } from "framer-motion";
import { Bookmark as BookmarkIcon } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import MangaCard from "@/components/MangaCard";
import { useBookmarks } from "@/hooks/useBookmarks";
import { mangaList } from "@/data/manga";

const Bookmarks = () => {
  const { bookmarks } = useBookmarks();
  const items = mangaList.filter((m) => bookmarks.includes(m.id));

  return (
    <PageTransition>
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-display font-bold mb-2"
          >
            <span className="gradient-text">Bookmarks</span>
          </motion.h1>
          <p className="text-sm text-muted-foreground mb-8">
            {items.length} saved {items.length === 1 ? "series" : "series"}
          </p>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-4 animate-pulse-glow">
                <BookmarkIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-display font-semibold mb-2">
                No bookmarks yet
              </h2>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Tap the heart on any manga to save it here for quick access.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-12">
              {items.map((manga, i) => (
                <MangaCard key={manga.id} manga={manga} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Bookmarks;
