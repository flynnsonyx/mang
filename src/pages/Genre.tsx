import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import MangaCard from "@/components/MangaCard";
import { mangaList } from "@/data/manga";

const Genre = () => {
  const { name } = useParams();
  const decoded = decodeURIComponent(name || "");
  const items = mangaList.filter((m) => m.genres.includes(decoded));
  const top = [...items].sort((a, b) => b.popularity - a.popularity)[0];

  return (
    <PageTransition>
      <div className="min-h-screen pt-16">
        {top && (
          <div className="relative h-56 overflow-hidden">
            <img
              src={top.cover}
              alt={decoded}
              className="w-full h-full object-cover blur-md scale-110"
            />
            <div className="absolute inset-0 bg-background/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-6">
              <Link
                to="/browse"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Browse
              </Link>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-display font-black"
              >
                <span className="gradient-text">{decoded}</span>
              </motion.h1>
              <p className="text-sm text-muted-foreground mt-1">
                {items.length} series curated for you
              </p>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No manga found in {decoded}.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-12">
              {items.map((m, i) => (
                <MangaCard key={m.id} manga={m} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Genre;
