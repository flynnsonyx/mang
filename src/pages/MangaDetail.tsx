import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Eye, BookOpen, Clock, User, ArrowLeft, CheckCircle2 } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { mangaList, getChapters } from "@/data/manga";
import { useReadingHistory } from "@/hooks/useReadingHistory";

const MangaDetail = () => {
  const { id } = useParams();
  const manga = mangaList.find((m) => m.id === id);
  const chapters = id ? getChapters(id) : [];
  const { isRead, getLastRead } = useReadingHistory();
  const lastRead = id ? getLastRead(id) : undefined;

  if (!manga) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-muted-foreground">
        Manga not found.
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pt-16">
        {/* Banner */}
        <div className="relative h-72 overflow-hidden">
          <img
            src={manga.cover}
            alt={manga.title}
            className="w-full h-full object-cover blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <Link
            to="/browse"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Cover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-48 shrink-0"
            >
              <div className="rounded-xl overflow-hidden glow-md">
                <img
                  src={manga.cover}
                  alt={manga.title}
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex-1"
            >
              <h1 className="text-3xl sm:text-4xl font-display font-black mb-2">
                <span className="gradient-text">{manga.title}</span>
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" /> {manga.author}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-primary fill-primary" /> {manga.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> {manga.views}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" /> {manga.chapters} Ch.
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {manga.year}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genres.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20"
                  >
                    {g}
                  </span>
                ))}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    manga.status === "Ongoing"
                      ? "bg-primary/20 text-primary"
                      : "bg-accent/20 text-accent"
                  }`}
                >
                  {manga.status}
                </span>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-2xl">
                {manga.description}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/manga/${manga.id}/read/1`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-md hover:glow-lg transition-all duration-300 hover:scale-105"
                >
                  <BookOpen className="w-4 h-4" />
                  Start Reading
                </Link>
                {lastRead && (
                  <Link
                    to={`/manga/${manga.id}/read/${lastRead.chapterId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/80 transition-all duration-300 hover:scale-105 border border-border/50"
                  >
                    <Clock className="w-4 h-4" />
                    Continue Ch. {lastRead.chapterId}
                  </Link>
                )}
              </div>
            </motion.div>
          </div>

          {/* Chapters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 pb-12"
          >
            <h2 className="text-xl font-display font-bold mb-4">Chapters</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {chapters.map((ch, i) => (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                >
                  <Link
                    to={`/manga/${manga.id}/read/${ch.id}`}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg glass-hover group ${
                      id && isRead(id, ch.id) ? "bg-primary/5 border border-primary/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {id && isRead(id, ch.id) && (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className={`text-sm font-medium transition-colors group-hover:text-primary ${
                        id && isRead(id, ch.id) ? "text-primary/70" : "text-foreground"
                      }`}>
                        {ch.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{ch.date}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MangaDetail;
