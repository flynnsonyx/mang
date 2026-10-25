import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Manga } from "@/data/manga";

interface Marquee3DProps {
  items: Manga[];
  /** Seconds for one full loop of a row. */
  duration?: number;
}

// The track animates to -50%, so the first half must be wider than any screen.
// 6 copies of a 4-card set ≈ 2200px of runway.
const REPEATS = 6;

const MarqueeRow = ({
  items,
  flip,
  duration,
}: {
  items: Manga[];
  flip?: boolean;
  duration: number;
}) => {
  const track = Array.from({ length: REPEATS }, () => items).flat();
  const uniqueCount = items.length;

  return (
    <div className="marquee3d">
      <div
        className={`marquee-track ${flip ? "reverse" : ""}`}
        style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
      >
        {track.map((manga, i) => {
          const isCopy = i >= uniqueCount;
          return (
            <Link
              key={`${manga.id}-${i}`}
              to={`/manga/${manga.id}`}
              aria-hidden={isCopy}
              tabIndex={isCopy ? -1 : 0}
              className="marquee-card group shrink-0 block w-32 sm:w-40"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-card/40 shadow-xl shadow-black/40 glow-sm group-hover:glow-md transition-shadow">
                <img
                  src={manga.cover}
                  alt={manga.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-display font-bold text-foreground text-xs leading-tight line-clamp-2">
                    {manga.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-primary font-medium">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    {manga.rating}
                    <span className="text-muted-foreground ml-1">{manga.status}</span>
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const Marquee3D = ({ items, duration = 36 }: Marquee3DProps) => {
  if (items.length === 0) return null;
  const rotate = (arr: Manga[], n: number) => arr.map((_, i) => arr[(i + n) % arr.length]);
  const cycle = (arr: Manga[], count: number) =>
    Array.from({ length: count }, (_, i) => arr[i % arr.length]);
  const mid = Math.ceil(items.length / 2);
  // Keep both rows full and varied even when a section has few titles.
  const rowA = cycle(items, Math.max(4, mid));
  const rowB = cycle(rotate(items, mid), Math.max(4, items.length - mid));

  return (
    <div className="relative py-2">
      {/* Edge fades so cards melt into the background */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-background to-transparent" />
      <div className="space-y-5">
        <MarqueeRow items={rowA} duration={duration} />
        <MarqueeRow items={rowB} flip duration={duration * 1.25} />
      </div>
    </div>
  );
};

export default Marquee3D;
