import { useEffect, useState, useCallback, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Review {
  id: string;
  manga_id: string;
  display_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const NAME_KEY = "yuvience-review-name";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
};

interface Props {
  mangaId: string;
}

const StarInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Your rating out of 5"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                active ? "text-primary fill-primary" : "text-muted-foreground"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

const ReviewSection = ({ mangaId }: Props) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("manga_id", mangaId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Could not load reviews");
    } else {
      setReviews((data as Review[]) || []);
    }
    setLoading(false);
  }, [mangaId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedComment = comment.trim();
    if (!trimmedName) return toast.error("Please enter a display name");
    if (rating < 1 || rating > 5) return toast.error("Please pick a rating");
    if (!trimmedComment) return toast.error("Please write a short review");
    if (trimmedComment.length > 1000)
      return toast.error("Review must be under 1000 characters");

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      manga_id: mangaId,
      display_name: trimmedName.slice(0, 40),
      rating,
      comment: trimmedComment,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to post review");
      return;
    }
    localStorage.setItem(NAME_KEY, trimmedName);
    setComment("");
    setRating(0);
    toast.success("Review posted");
    load();
  };

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <section aria-labelledby="reviews-heading" className="mt-10">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2
          id="reviews-heading"
          className="text-xl font-display font-bold flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5 text-primary" aria-hidden="true" />
          Community Reviews
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star
              className="w-4 h-4 text-primary fill-primary"
              aria-hidden="true"
            />
            <span className="font-semibold text-foreground">
              {avg.toFixed(1)}
            </span>
            <span>· {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="glass rounded-xl p-4 mb-6 border border-border/30 space-y-3"
        aria-label="Post a review"
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <span className="text-xs font-medium text-muted-foreground">
              Display name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="e.g. MangaFan"
              className="px-3 py-2 rounded-lg bg-secondary/60 border border-border/40 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
              required
            />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Your rating
            </span>
            <StarInput value={rating} onChange={setRating} />
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Review
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="What did you like about it?"
            className="px-3 py-2 rounded-lg bg-secondary/60 border border-border/40 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
            required
          />
          <span className="text-[10px] text-muted-foreground self-end">
            {comment.length}/1000
          </span>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-sm hover:glow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
            Post review
          </button>
        </div>
      </form>

      {loading ? (
        <div
          className="flex items-center justify-center py-8 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading reviews</span>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No reviews yet. Be the first to share what you liked!
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Reviews">
          <AnimatePresence initial={false}>
            {reviews.map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="glass rounded-xl p-4 border border-border/20"
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                      {r.display_name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm truncate">
                      {r.display_name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(r.created_at)}
                  </span>
                </div>
                <div
                  className="flex items-center gap-0.5 mb-2"
                  aria-label={`Rated ${r.rating} out of 5`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-3.5 h-3.5 ${
                        n <= r.rating
                          ? "text-primary fill-primary"
                          : "text-muted-foreground/40"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                  {r.comment}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
};

export default ReviewSection;
