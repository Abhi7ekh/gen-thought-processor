BEGIN;

LOCK TABLE public.thoughts IN ACCESS EXCLUSIVE MODE;

UPDATE public.thoughts
SET archived = true,
    status = 'reviewed'
WHERE status = 'archived';

ALTER TABLE public.thoughts
DROP CONSTRAINT IF EXISTS thoughts_status_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.thoughts'::regclass
      AND conname = 'thoughts_status_check'
  ) THEN
    ALTER TABLE public.thoughts
    ADD CONSTRAINT thoughts_status_check
    CHECK (status IN ('new', 'reviewed', 'important'));
  END IF;
END;
$$;

COMMIT;
