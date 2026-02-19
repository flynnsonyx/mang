import { useState } from "react";
import { motion } from "framer-motion";
import MangaCard from "@/components/MangaCard";
import PageTransition from "@/components/PageTransition";
import { mangaList, genres } from "@/data/manga";

const Browse = () => {
  const [activeGenre, setActiveGenre] = useState("All");

  const filtered =
    activeGenre === "All"
      ? mangaList
      : mangaList.filter((m) => m.genres.includes(activeGenre));

  return (
    <PageTransition>
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-display font-bold mb-6"
          >
            <span className="gradient-text">Browse Manga</span>
          </motion.h1>

          {/* Genre Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeGenre === genre
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary"
                }`}
              >
                {activeGenre === genre && (
                  <motion.div
                    layoutId="genre-active"
                    className="absolute inset-0 gradient-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{genre}</span>
              </button>
            ))}
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-12">
            {filtered.map((manga, i) => (
              <MangaCard key={manga.id} manga={manga} index={i} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No manga found in this genre.
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Browse;
