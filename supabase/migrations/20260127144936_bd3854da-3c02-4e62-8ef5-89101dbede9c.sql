-- Allow anyone (including anonymous users) to read active campaigns for public registration pages
CREATE POLICY "Anyone can view active campaigns for registration"
ON public.campanhas
FOR SELECT
USING (ativa = true);