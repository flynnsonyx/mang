import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useBookmarks } from "@/hooks/useBookmarks";
import { cn } from "@/lib/utils";

interface Props {
  mangaId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const BookmarkButton = ({ mangaId, size = "sm", className, showLabel }: Props) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const active = isBookmarked(mangaId);

  const dims =
    size === "lg"
      ? "px-4 py-3 text-sm"
      : size === "md"
      ? "p-2.5"
      : "p-1.5";
  const icon = size === "lg" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-4 h-4";

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(mangaId);
      }}
      aria-label={active ? "Remove bookmark" : "Add bookmark"}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl transition-all duration-300 backdrop-blur-md",
        active
          ? "bg-primary/90 text-primary-foreground glow-md"
          : "bg-background/60 text-foreground hover:bg-secondary border border-border/50",
        dims,
        className
      )}
    >
      <Heart className={cn(icon, active && "fill-current")} />
      {showLabel && <span className="font-semibold">{active ? "Bookmarked" : "Bookmark"}</span>}
    </motion.button>
  );
};

export default BookmarkButton;
