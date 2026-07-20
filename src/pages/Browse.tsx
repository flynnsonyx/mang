import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import MangaCard from "@/components/MangaCard";
import PageTransition from "@/components/PageTransition";
import { mangaList, genres } from "@/data/manga";

type SortKey = "popularity" | "rating" | "newest" | "updated";
type StatusFilter = "All" | "Ongoing" | "Completed";

const Browse = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("popularity");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [minYear, setMinYear] = useState(2005);
  const [showFilters, setShowFilters] = useState(true);

  const toggleGenre = (g: string) => {
    if (g === "All") return setSelectedGenres([]);
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const filtered = useMemo(() => {
    let list = [...mangaList];
    if (selectedGenres.length > 0)
      list = list.filter((m) => selectedGenres.every((g) => m.genres.includes(g)));
    if (status !== "All") list = list.filter((m) => m.status === status);
    list = list.filter((m) => m.year >= minYear);

    switch (sort) {
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        list.sort((a, b) => b.year - a.year);
        break;
      case "updated":
        list.sort((a, b) => a.updatedDaysAgo - b.updatedDaysAgo);
        break;
      default:
        list.sort((a, b) => b.popularity - a.popularity);
    }
    return list;
  }, [selectedGenres, sort, status, minYear]);

  const clearAll = () => {
    setSelectedGenres([]);
    setSort("popularity");
    setStatus("All");
    setMinYear(2005);
  };

  const activeCount =
    selectedGenres.length +
    (status !== "All" ? 1 : 0) +
    (minYear !== 2005 ? 1 : 0);

  return (
    <PageTransition>
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-display font-bold"
            >
              <span className="gradient-text">Browse Manga</span>
            </motion.h1>

            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="px-3 py-2 rounded-lg bg-secondary text-sm border border-border/50 outline-none focus:border-primary transition-colors"
              >
                <option value="popularity">Popularity</option>
                <option value="rating">Rating</option>
                <option value="newest">Newest</option>
                <option value="updated">Recently Updated</option>
              </select>
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm border border-border/50 hover:border-primary transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass border border-border/30 rounded-2xl p-4 mb-6 space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Genres</span>
                  {activeCount > 0 && (
                    <button onClick={clearAll} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => {
                    const active =
                      g === "All" ? selectedGenres.length === 0 : selectedGenres.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          active
                            ? "gradient-primary text-primary-foreground glow-sm"
                            : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-2">Status</span>
                  <div className="flex gap-2">
                    {(["All", "Ongoing", "Completed"] as StatusFilter[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          status === s
                            ? "gradient-primary text-primary-foreground glow-sm"
                            : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">From year</span>
                    <span className="text-xs text-primary font-mono">{minYear}+</span>
                  </div>
                  <input
                    type="range"
                    min={2005}
                    max={2024}
                    value={minYear}
                    onChange={(e) => setMinYear(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <p className="text-xs text-muted-foreground mb-4">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-12">
            {filtered.map((manga, i) => (
              <MangaCard key={manga.id} manga={manga} index={i} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No manga match those filters.
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Browse;
