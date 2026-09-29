BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.thoughts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  heading text NOT NULL CHECK (
    char_length(trim(heading)) > 0
    AND char_length(heading) <= 200
  ),
  elaboration text NOT NULL CHECK (
    char_length(trim(elaboration)) > 0
    AND char_length(elaboration) <= 20000
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_rating integer NULL CHECK (user_rating IS NULL OR user_rating BETWEEN 1 AND 10),
  system_rating integer NULL CHECK (system_rating IS NULL OR system_rating BETWEEN 1 AND 10),
  priority smallint NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 5),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'important', 'archived')),
  archived boolean NOT NULL DEFAULT false,
  system_rating_details jsonb NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thoughts_set_updated_at
BEFORE UPDATE ON public.thoughts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX thoughts_user_created_at_idx
ON public.thoughts (user_id, created_at DESC);

CREATE INDEX thoughts_user_updated_at_idx
ON public.thoughts (user_id, updated_at DESC);

CREATE INDEX thoughts_user_status_archived_created_at_idx
ON public.thoughts (user_id, status, archived, created_at DESC);

CREATE INDEX thoughts_user_priority_created_at_idx
ON public.thoughts (user_id, priority, created_at DESC);

CREATE INDEX thoughts_user_system_rating_created_at_idx
ON public.thoughts (user_id, system_rating, created_at DESC);

CREATE INDEX thoughts_search_idx
ON public.thoughts
USING gin (
  to_tsvector('english', coalesce(heading, '') || ' ' || coalesce(elaboration, ''))
);

ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own thoughts"
ON public.thoughts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own thoughts"
ON public.thoughts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own thoughts"
ON public.thoughts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own thoughts"
ON public.thoughts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

COMMIT;
