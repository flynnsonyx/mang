ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS has_spoiler boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS content_warnings text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS reviews_manga_created_idx ON public.reviews (manga_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_manga_helpful_idx ON public.reviews (manga_id, helpful_count DESC);

CREATE TABLE public.review_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);

GRANT SELECT ON public.review_votes TO anon;
GRANT SELECT, INSERT, DELETE ON public.review_votes TO authenticated;
GRANT ALL ON public.review_votes TO service_role;

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review votes" ON public.review_votes FOR SELECT USING (true);
CREATE POLICY "Users can add their own vote" ON public.review_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove their own vote" ON public.review_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.sync_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  ELSE
    UPDATE public.reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS review_votes_sync_count ON public.review_votes;
CREATE TRIGGER review_votes_sync_count
AFTER INSERT OR DELETE ON public.review_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_review_helpful_count();