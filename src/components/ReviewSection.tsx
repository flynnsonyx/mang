import { useEffect, useState, useCallback, useMemo, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageSquare,
  Send,
  Loader2,
  Pencil,
  Trash2,
  X,
  Check,
  ArrowUpDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Review {
  id: string;
  manga_id: string;
  display_name: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string | null;
}

const NAME_KEY = "yuvience-review-name";

type SortKey = "newest" | "oldest" | "highest" | "lowest";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "highest", label: "Highest rated" },
  { key: "lowest", label: "Lowest rated" },
];

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
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  size?: "sm" | "md";
}) => {
  const [hover, setHover] = useState(0);
  const cls = size === "sm" ? "w-4 h-4" : "w-6 h-6";
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
              className={`${cls} transition-colors ${
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
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [sort, setSort] = useState<SortKey>("newest");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [mineOnly, setMineOnly] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
      user_id: user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to post review");
      return;
    }
    localStorage.setItem(NAME_KEY, trimmedName);
    setComment("");
    setRating(0);
    toast.success(
      user ? "Review posted" : "Review posted — sign in to edit it later"
    );
    load();
  };

  const startEdit = (r: Review) => {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditComment("");
    setEditRating(0);
  };

  const saveEdit = async (id: string) => {
    const trimmed = editComment.trim();
    if (editRating < 1 || editRating > 5) return toast.error("Pick a rating");
    if (!trimmed) return toast.error("Review can't be empty");
    if (trimmed.length > 1000)
      return toast.error("Review must be under 1000 characters");

    setSavingEdit(true);
    const { error } = await supabase
      .from("reviews")
      .update({ rating: editRating, comment: trimmed })
      .eq("id", id);
    setSavingEdit(false);
    if (error) {
      toast.error("Failed to update review");
      return;
    }
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, rating: editRating, comment: trimmed } : r
      )
    );
    cancelEdit();
    toast.success("Review updated");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete review");
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success("Review deleted");
  };

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const visible = useMemo(() => {
    let list = [...reviews];
    if (starFilter) list = list.filter((r) => r.rating === starFilter);
    if (mineOnly && user) list = list.filter((r) => r.user_id === user.id);
    switch (sort) {
      case "oldest":
        list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        break;
      case "highest":
        list.sort(
          (a, b) =>
            b.rating - a.rating ||
            +new Date(b.created_at) - +new Date(a.created_at)
        );
        break;
      case "lowest":
        list.sort(
          (a, b) =>
            a.rating - b.rating ||
            +new Date(b.created_at) - +new Date(a.created_at)
        );
        break;
      default:
        list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return list;
  }, [reviews, sort, starFilter, mineOnly, user]);

  const counts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => (c[r.rating] = (c[r.rating] || 0) + 1));
    return c;
  }, [reviews]);

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

        <div className="flex justify-between items-center gap-3 flex-wrap">
          <p className="text-[11px] text-muted-foreground">
            {user
              ? "Signed in — you can edit or delete your reviews anytime."
              : "Posting as a guest. Sign in to edit or delete your reviews later."}
          </p>
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

      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort reviews"
              className="px-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border/40 text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by rating">
            <button
              type="button"
              onClick={() => setStarFilter(null)}
              aria-pressed={starFilter === null}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                starFilter === null
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((n) => (
              <button
                key={n}
                type="button"
                disabled={!counts[n]}
                onClick={() => setStarFilter(starFilter === n ? null : n)}
                aria-pressed={starFilter === n}
                aria-label={`Show ${n} star reviews`}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  starFilter === n
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
                <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                <span className="opacity-60">{counts[n]}</span>
              </button>
            ))}
          </div>

          {user && (
            <button
              type="button"
              onClick={() => setMineOnly((v) => !v)}
              aria-pressed={mineOnly}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                mineOnly
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              My reviews
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div
          className="flex items-center justify-center py-8 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading reviews</span>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {reviews.length === 0
            ? "No reviews yet. Be the first to share what you liked!"
            : "No reviews match these filters."}
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Reviews">
          <AnimatePresence initial={false}>
            {visible.map((r, i) => {
              const mine = !!user && r.user_id === user.id;
              const editing = editingId === r.id;
              return (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className={`glass rounded-xl p-4 border ${
                    mine ? "border-primary/30" : "border-border/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                        {r.display_name.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm truncate">
                        {r.display_name}
                      </span>
                      {mine && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(r.created_at)}
                      </span>
                      {mine && !editing && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            aria-label="Edit your review"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(r.id)}
                            aria-label="Delete your review"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editing ? (
                    <div className="space-y-2">
                      <StarInput
                        value={editRating}
                        onChange={setEditRating}
                        size="sm"
                      />
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        aria-label="Edit your review"
                        className="w-full px-3 py-2 rounded-lg bg-secondary/60 border border-border/40 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-all"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingEdit}
                          onClick={() => saveEdit(r.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold gradient-primary text-primary-foreground glow-sm disabled:opacity-50 transition-all"
                        >
                          {savingEdit ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
};

export default ReviewSection;
