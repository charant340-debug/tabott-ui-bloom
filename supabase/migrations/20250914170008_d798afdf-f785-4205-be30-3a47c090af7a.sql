-- Convert all timestamps from incorrect UTC storage to proper UTC (subtracting IST offset)
-- This fixes timestamps that were stored as IST but marked as UTC

-- Fix pills.last_taken_at timestamps
UPDATE public.pills 
SET last_taken_at = last_taken_at - INTERVAL '5 hours 30 minutes'
WHERE last_taken_at IS NOT NULL;

-- Fix tracking table intake timestamps
UPDATE public.tracking 
SET 
  first_intake = CASE WHEN first_intake IS NOT NULL THEN first_intake - INTERVAL '5 hours 30 minutes' ELSE NULL END,
  second_intake = CASE WHEN second_intake IS NOT NULL THEN second_intake - INTERVAL '5 hours 30 minutes' ELSE NULL END,
  third_intake = CASE WHEN third_intake IS NOT NULL THEN third_intake - INTERVAL '5 hours 30 minutes' ELSE NULL END
WHERE first_intake IS NOT NULL OR second_intake IS NOT NULL OR third_intake IS NOT NULL;