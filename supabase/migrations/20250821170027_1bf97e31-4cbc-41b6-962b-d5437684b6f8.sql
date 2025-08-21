-- Fix double timezone application by removing AT TIME ZONE conversions
CREATE OR REPLACE FUNCTION update_pill_last_taken()
RETURNS TRIGGER AS $$
DECLARE
  latest_intake TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determine the latest intake time from the three columns without timezone re-interpretation
  IF NEW.third_intake IS NOT NULL THEN
    latest_intake := NEW.third_intake;
  ELSIF NEW.second_intake IS NOT NULL THEN
    latest_intake := NEW.second_intake;
  ELSIF NEW.first_intake IS NOT NULL THEN
    latest_intake := NEW.first_intake;
  ELSE
    latest_intake := NULL;
  END IF;
  
  -- Update the last_taken_at column in pills table (store as UTC timestamptz)
  IF latest_intake IS NOT NULL THEN
    UPDATE public.pills 
    SET last_taken_at = latest_intake,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- One-time backfill to correct any previously double-shifted values
WITH latest AS (
  SELECT t.id AS pill_id, t.third_intake, t.second_intake, t.first_intake, t.date,
         COALESCE(t.third_intake, t.second_intake, t.first_intake) AS latest_intake
  FROM public.tracking t
  JOIN (
    SELECT id, MAX(date) AS max_date
    FROM public.tracking
    GROUP BY id
  ) m ON m.id = t.id AND m.max_date = t.date
)
UPDATE public.pills p
SET last_taken_at = l.latest_intake
FROM latest l
WHERE p.id = l.pill_id
  AND l.latest_intake IS NOT NULL;