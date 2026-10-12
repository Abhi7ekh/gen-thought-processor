BEGIN;

DROP INDEX IF EXISTS public.thoughts_search_idx;

CREATE INDEX thoughts_heading_search_idx
ON public.thoughts
USING gin (to_tsvector('english', heading));

CREATE INDEX thoughts_elaboration_search_idx
ON public.thoughts
USING gin (to_tsvector('english', elaboration));

COMMIT;
