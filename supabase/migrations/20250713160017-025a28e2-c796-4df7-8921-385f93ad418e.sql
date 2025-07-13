-- Drop existing constraints and indexes
DROP INDEX IF EXISTS idx_tracking_pill_id;
DROP INDEX IF EXISTS idx_tracking_user_pill_date;
ALTER TABLE public.tracking DROP CONSTRAINT IF EXISTS fk_tracking_pill_id;

-- Drop the current primary key and pill_id column
ALTER TABLE public.tracking DROP CONSTRAINT IF EXISTS tracking_pkey;
ALTER TABLE public.tracking DROP COLUMN IF EXISTS pill_id;

-- Rename the id column to be the pill reference and make it the primary key
ALTER TABLE public.tracking ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.tracking ADD PRIMARY KEY (id, user_id, date);

-- Add foreign key constraint to pills table using id column
ALTER TABLE public.tracking 
ADD CONSTRAINT fk_tracking_id 
FOREIGN KEY (id) REFERENCES public.pills(id) ON DELETE CASCADE;

-- Update unique constraint
ALTER TABLE public.tracking DROP CONSTRAINT IF EXISTS tracking_user_id_pill_id_date_key;
ALTER TABLE public.tracking ADD CONSTRAINT tracking_user_id_id_date_key UNIQUE(user_id, id, date);

-- Recreate indexes with new structure
CREATE INDEX idx_tracking_id ON public.tracking(id);
CREATE INDEX idx_tracking_user_id_date ON public.tracking(user_id, id, date);

-- Insert sample data (using a placeholder user_id and pill_id - adjust as needed)
INSERT INTO public.tracking (id, user_id, date, first_intake, second_intake, third_intake, taken, to_be_taken, skipped)
VALUES 
  (
    (SELECT id FROM public.pills LIMIT 1),  -- Use first available pill id
    (SELECT id FROM public.profiles LIMIT 1),  -- Use first available user id
    CURRENT_DATE,
    '2025-01-13 08:00:00+00',
    '2025-01-13 14:00:00+00',
    '2025-01-13 20:00:00+00',
    3,
    3,
    0
  )
ON CONFLICT (user_id, id, date) DO NOTHING;