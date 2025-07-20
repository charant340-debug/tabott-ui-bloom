-- Delete all existing tracking data
DELETE FROM public.tracking;

-- Insert one tracking row for each pill for the existing user with random data
INSERT INTO public.tracking (id, user_id, date, first_intake, second_intake, third_intake, taken, to_be_taken, skipped)
SELECT 
  p.id as id,
  p.user_id,
  CURRENT_DATE as date,
  CASE 
    WHEN random() > 0.3 THEN CURRENT_DATE + (p.dose1_time || ' hours')::interval
    ELSE NULL
  END as first_intake,
  CASE 
    WHEN random() > 0.5 THEN CURRENT_DATE + (p.dose2_time || ' hours')::interval
    ELSE NULL
  END as second_intake,
  CASE 
    WHEN random() > 0.7 THEN CURRENT_DATE + (p.dose3_time || ' hours')::interval
    ELSE NULL
  END as third_intake,
  floor(random() * 4)::integer as taken,
  floor(random() * 3 + 1)::integer as to_be_taken,
  floor(random() * 2)::integer as skipped
FROM public.pills p;