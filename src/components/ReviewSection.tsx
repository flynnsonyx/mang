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
  ThumbsUp,
  EyeOff,
  AlertTriangle,
  ChevronDown,
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
  has_spoiler: boolean;
  content_warnings: string[];
  helpful_count: number;
}

const NAME_KEY = "yuvience-review-name";
const SPOILER_PREF_KEY = "yuvience-reveal-spoilers";
const REVEALED_KEY = "yuvience-revealed-reviews";
const PAGE_SIZE = 5;

const WARNING_TAGS = [
  "Violence",
  "Gore",
  "Sexual content",
  "Self-harm",
  "Abuse",
  "Death",
];

type SortKey = "helpful" | "newest" | "oldest" | "highest" | "lowest";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "helpful", label: "Most helpful" },
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "highest", label: "Highest rated" },
  { key: "lowest", label: "Lowest rated" },
];

const ORDER: Record<SortKey, { column: string; ascending: boolean }[]> = {
  helpful: [
    { column: "helpful_count", ascending: false },
    { column: "created_at", ascending: false },
  ],
  newest: [{ column: "created_at", ascending: false }],
  oldest: [{ column: "created_at", ascending: true }],
  highest: [
    { column: "rating", ascending: false },
    { column: "created_at", ascending: false },
  ],
  lowest: [
    { column: "rating", ascending: true },
    { column: "created_at", ascending: false },
  ],
};

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

const TagToggle = ({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active
        ? "bg-primary/20 text-primary border-primary/30"
        : "border-border/40 text-muted-foreground hover:text-foreground"
    }`}
  >
    {icon}
    {label}
  </button>
);

const ReviewSection = ({ mangaId }: Props) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [sort, setSort] = useState<SortKey>("helpful");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [mineOnly, setMineOnly] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editSpoiler, setEditSpoiler] = useState(false);
  const [editWarnings, setEditWarnings] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [votingId, setVotingId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });

  const db = supabase as unknown as {
    from: (t: string) => any;
  };

  const buildQuery = useCallback(
    (from: number, to: number) => {
      let q = db
        .from("reviews")
        .select("*", { count: "exact" })
        .eq("manga_id", mangaId);
      if (starFilter) q = q.eq("rating", starFilter);
      if (mineOnly && user) q = q.eq("user_id", user.id);
      ORDER[sort].forEach((o) =>
        (q = q.order(o.column, { ascending: o.ascending }))
      );
      return q.range(from, to);
    },
    [mangaId, starFilter, mineOnly, user, sort]
  );

  const fetchVotes = useCallback(
    async (ids: string[]) => {
      if (!user || ids.length === 0) return;
      const { data } = await db
        .from("review_votes")
        .select("review_id")
        .eq("user_id", user.id)
        .in("review_id", ids);
      if (data) {
        setMyVotes((prev) => {
          const next = new Set(prev);
          (data as { review_id: string }[]).forEach((v) =>
            next.add(v.review_id)
          );
          return next;
        });
      }
    },
    [user]
  );

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error, count } = await buildQuery(0, PAGE_SIZE - 1);
    if (error) {
      toast.error("Could not load reviews");
    } else {
      const list = (data as Review[]) || [];
      setReviews(list);
      setTotal(count ?? list.length);
      fetchVotes(list.map((r) => r.id));
    }
    setLoading(false);
  }, [buildQuery, fetchVotes]);

  const loadMore = async () => {
    setLoadingMore(true);
    const { data, error, count } = await buildQuery(
      reviews.length,
      reviews.length + PAGE_SIZE - 1
    );
    if (error) {
      toast.error("Could not load more reviews");
    } else {
      const list = (data as Review[]) || [];
      setReviews((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...list.filter((r) => !seen.has(r.id))];
      });
      setTotal(count ?? total);
      fetchVotes(list.map((r) => r.id));
    }
    setLoadingMore(false);
  };

  const loadCounts = useCallback(async () => {
    const results = await Promise.all(
      [1, 2, 3, 4, 5].map((n) =>
        db
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("manga_id", mangaId)
          .eq("rating", n)
      )
    );
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    results.forEach((r: { count: number | null }, i) => {
      c[i + 1] = r.count ?? 0;
    });
    setCounts(c);
  }, [mangaId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const totalAll = useMemo(
    () => Object.values(counts).reduce((s, n) => s + n, 0),
    [counts]
  );
  const avg = useMemo(() => {
    if (!totalAll) return 0;
    const sum = [1, 2, 3, 4, 5].reduce((s, n) => s + n * counts[n], 0);
    return sum / totalAll;
  }, [counts, totalAll]);

  const toggleWarning = (tag: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);

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
    const { error } = await db.from("reviews").insert({
      manga_id: mangaId,
      display_name: trimmedName.slice(0, 40),
      rating,
      comment: trimmedComment,
      user_id: user?.id ?? null,
      has_spoiler: spoiler,
      content_warnings: warnings,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to post review");
      return;
    }
    localStorage.setItem(NAME_KEY, trimmedName);
    setComment("");
    setRating(0);
    setSpoiler(false);
    setWarnings([]);
    toast.success(
      user ? "Review posted" : "Review posted — sign in to edit it later"
    );
    load();
    loadCounts();
  };

  const startEdit = (r: Review) => {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment);
    setEditSpoiler(r.has_spoiler);
    setEditWarnings(r.content_warnings || []);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditComment("");
    setEditRating(0);
    setEditSpoiler(false);
    setEditWarnings([]);
  };

  const saveEdit = async (id: string) => {
    const trimmed = editComment.trim();
    if (editRating < 1 || editRating > 5) return toast.error("Pick a rating");
    if (!trimmed) return toast.error("Review can't be empty");
    if (trimmed.length > 1000)
      return toast.error("Review must be under 1000 characters");

    setSavingEdit(true);
    const { error } = await db
      .from("reviews")
      .update({
        rating: editRating,
        comment: trimmed,
        has_spoiler: editSpoiler,
        content_warnings: editWarnings,
      })
      .eq("id", id);
    setSavingEdit(false);
    if (error) {
      toast.error("Failed to update review");
      return;
    }
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              rating: editRating,
              comment: trimmed,
              has_spoiler: editSpoiler,
              content_warnings: editWarnings,
            }
          : r
      )
    );
    cancelEdit();
    loadCounts();
    toast.success("Review updated");
  };

  const remove = async (id: string) => {
    const { error } = await db.from("reviews").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete review");
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => Math.max(t - 1, 0));
    loadCounts();
    toast.success("Review deleted");
  };

  const toggleHelpful = async (r: Review) => {
    if (!user) {
      toast.error("Sign in to mark reviews as helpful");
      return;
    }
    const voted = myVotes.has(r.id);
    setVotingId(r.id);
    const { error } = voted
      ? await db
          .from("review_votes")
          .delete()
          .eq("review_id", r.id)
          .eq("user_id", user.id)
      : await db
          .from("review_votes")
          .insert({ review_id: r.id, user_id: user.id });
    setVotingId(null);
    if (error) {
      toast.error("Could not update your vote");
      return;
    }
    setMyVotes((prev) => {
      const next = new Set(prev);
      voted ? next.delete(r.id) : next.add(r.id);
      return next;
    });
    setReviews((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? {
              ...x,
              helpful_count: Math.max(x.helpful_count + (voted ? -1 : 1), 0),
            }
          : x
      )
    );
  };

  const hasMore = reviews.length < total;

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
        {totalAll > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star
              className="w-4 h-4 text-primary fill-primary"
              aria-hidden="true"
            />
            <span className="font-semibold text-foreground">
              {avg.toFixed(1)}
            </span>
            <span>
              · {totalAll} review{totalAll === 1 ? "" : "s"}
            </span>
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

        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground block">
            Safety tags (optional)
          </span>
          <div className="flex flex-wrap gap-1.5">
            <TagToggle
              label="Contains spoilers"
              active={spoiler}
              onClick={() => setSpoiler((v) => !v)}
              icon={<EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
            />
            {WARNING_TAGS.map((tag) => (
              <TagToggle
                key={tag}
                label={tag}
                active={warnings.includes(tag)}
                onClick={() => toggleWarning(tag, warnings, setWarnings)}
                icon={
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                }
              />
            ))}
          </div>
        </div>

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

      {totalAll > 0 && (
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

          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter by rating"
          >
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
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {totalAll === 0
            ? "No reviews yet. Be the first to share what you liked!"
            : "No reviews match these filters."}
        </p>
      ) : (
        <>
          <ul className="space-y-3" aria-label="Reviews">
            <AnimatePresence initial={false}>
              {reviews.map((r, i) => {
                const mine = !!user && r.user_id === user.id;
                const editing = editingId === r.id;
                const voted = myVotes.has(r.id);
                const hidden =
                  (r.has_spoiler || (r.content_warnings?.length ?? 0) > 0) &&
                  !revealed.has(r.id);
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
                              <Pencil
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(r.id)}
                              aria-label="Delete your review"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <Trash2
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
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
                        <div className="flex flex-wrap gap-1.5">
                          <TagToggle
                            label="Contains spoilers"
                            active={editSpoiler}
                            onClick={() => setEditSpoiler((v) => !v)}
                            icon={
                              <EyeOff
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
                            }
                          />
                          {WARNING_TAGS.map((tag) => (
                            <TagToggle
                              key={tag}
                              label={tag}
                              active={editWarnings.includes(tag)}
                              onClick={() =>
                                toggleWarning(tag, editWarnings, setEditWarnings)
                              }
                              icon={
                                <AlertTriangle
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                              }
                            />
                          ))}
                        </div>
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
                              <Loader2
                                className="w-3.5 h-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Check
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
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

                        {(r.has_spoiler ||
                          (r.content_warnings?.length ?? 0) > 0) && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            {r.has_spoiler && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/20 text-accent border border-accent/30">
                                <EyeOff
                                  className="w-3 h-3"
                                  aria-hidden="true"
                                />
                                Spoilers
                              </span>
                            )}
                            {(r.content_warnings || []).map((w) => (
                              <span
                                key={w}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/15 text-destructive border border-destructive/25"
                              >
                                <AlertTriangle
                                  className="w-3 h-3"
                                  aria-hidden="true"
                                />
                                {w}
                              </span>
                            ))}
                          </div>
                        )}

                        {hidden ? (
                          <button
                            type="button"
                            onClick={() =>
                              setRevealed((prev) => new Set(prev).add(r.id))
                            }
                            className="w-full text-left text-sm text-muted-foreground italic px-3 py-4 rounded-lg bg-secondary/40 border border-border/30 hover:text-foreground transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            This review is tagged
                            {r.has_spoiler ? " as containing spoilers" : ""}
                            {r.has_spoiler &&
                            (r.content_warnings?.length ?? 0) > 0
                              ? " and"
                              : ""}
                            {(r.content_warnings?.length ?? 0) > 0
                              ? ` with content warnings (${r.content_warnings.join(
                                  ", "
                                )})`
                              : ""}
                            . Tap to reveal.
                          </button>
                        ) : (
                          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                            {r.comment}
                          </p>
                        )}

                        <div className="mt-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => toggleHelpful(r)}
                            disabled={votingId === r.id}
                            aria-pressed={voted}
                            aria-label={
                              voted
                                ? "Remove your helpful vote"
                                : "Mark this review as helpful"
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              voted
                                ? "bg-primary/20 text-primary border-primary/30"
                                : "border-border/40 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <ThumbsUp
                              className={`w-3.5 h-3.5 ${
                                voted ? "fill-current" : ""
                              }`}
                              aria-hidden="true"
                            />
                            Helpful
                            {r.helpful_count > 0 && (
                              <span className="opacity-70">
                                {r.helpful_count}
                              </span>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <div className="mt-5 flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Showing {reviews.length} of {total} review
              {total === 1 ? "" : "s"}
            </p>
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold border border-border/50 hover:bg-secondary/80 disabled:opacity-50 transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
                Load more reviews
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default ReviewSection;
