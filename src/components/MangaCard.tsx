import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Eye } from "lucide-react";
import type { Manga } from "@/data/manga";
import BookmarkButton from "@/components/BookmarkButton";
import { useReadingHistory } from "@/hooks/useReadingHistory";

interface MangaCardProps {
  manga: Manga;
  index?: number;
}

const MangaCard = ({ manga, index = 0 }: MangaCardProps) => {
  const { getLastRead } = useReadingHistory();
  const lastRead = getLastRead(manga.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <Link to={`/manga/${manga.id}`} className="block">
        <div className="relative rounded-xl overflow-hidden glass-hover">
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={manga.cover}
              alt={manga.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
          </div>

          <div className="absolute top-3 left-3">
            <BookmarkButton mangaId={manga.id} />
          </div>

          <div className="absolute top-3 right-3">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                manga.status === "Ongoing"
                  ? "bg-primary/80 text-primary-foreground"
                  : "bg-accent/80 text-accent-foreground"
              }`}
            >
              {manga.status}
            </span>
          </div>

          {lastRead && (
            <div className="absolute bottom-[68px] left-3 right-3">
              <div className="px-2 py-1 rounded-md bg-background/70 backdrop-blur-md text-[10px] text-primary font-medium border border-primary/30">
                Continue Ch. {lastRead.chapterId}
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display font-bold text-foreground text-sm leading-tight mb-1 line-clamp-2">
              {manga.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-primary fill-primary" />
                {manga.rating}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {manga.views}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default MangaCard;
