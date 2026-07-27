DROP POLICY IF EXISTS "Anyone can post a review" ON public.reviews;
CREATE POLICY "Anyone can post a review"
ON public.reviews FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);