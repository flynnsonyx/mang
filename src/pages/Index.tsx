import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, BookOpen, TrendingUp } from "lucide-react";
import MangaCard from "@/components/MangaCard";
import PageTransition from "@/components/PageTransition";
import { mangaList } from "@/data/manga";

const Index = () => {
  const featured = mangaList[0];
  const trending = mangaList.slice(0, 4);
  const popular = mangaList.slice(2, 8);

  return (
    <PageTransition>
      <div className="min-h-screen pt-16">
        {/* Hero Section */}
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={featured.cover}
              alt={featured.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
          </div>

          <div className="relative container mx-auto px-4 h-full flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="max-w-lg"
            >
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-medium mb-4"
              >
                <TrendingUp className="w-3 h-3" />
                Featured Manga
              </motion.span>

              <h1 className="text-5xl sm:text-6xl font-display font-black mb-4 leading-tight">
                <span className="gradient-text">{featured.title}</span>
              </h1>

              <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                {featured.description}
              </p>

              <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground">
                {featured.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/manga/${featured.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-md hover:glow-lg transition-all duration-300 hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Reading
                </Link>
                <Link
                  to={`/manga/${featured.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-hover text-foreground font-semibold text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Details
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trending Section */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold">
                <span className="gradient-text">Trending Now</span>
              </h2>
              <Link
                to="/browse"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {trending.map((manga, i) => (
                <MangaCard key={manga.id} manga={manga} index={i} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* Popular Section */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold">
                <span className="gradient-text">Popular Series</span>
              </h2>
              <Link
                to="/browse"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popular.map((manga, i) => (
                <MangaCard key={manga.id} manga={manga} index={i} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-8">
          <div className="container mx-auto px-4 text-center">
            <span className="text-sm text-muted-foreground">
              © 2024 <span className="gradient-text font-semibold">Yuvience</span>. Read manga for free.
            </span>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Index;
