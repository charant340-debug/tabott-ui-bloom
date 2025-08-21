-- Insert sample tracking data for the current week to demonstrate charts
-- Simple approach without nested DECLARE blocks

INSERT INTO public.tracking (id, user_id, date, taken, to_be_taken, skipped, first_intake, second_intake, third_intake) 
VALUES 
-- Magnesium (1 dose scheduled)
('b455535c-9e4d-4916-b9d0-ce70f7ec4b74', '64c999ab-c5aa-4c4c-8ba5-ee8ef1ed5fee', CURRENT_DATE, 1, 0, 0, CURRENT_DATE + '19:01:00'::TIME, NULL, NULL),
('b455535c-9e4d-4916-b9d0-ce70f7ec4b74', '64c999ab-c5aa-4c4c-8ba5-ee8ef1ed5fee', CURRENT_DATE - 1, 1, 0, 0, CURRENT_DATE - 1 + '19:01:00'::TIME, NULL, NULL),
('b455535c-9e4d-4916-b9d0-ce70f7ec4b74', '64c999ab-c5aa-4c4c-8ba5-ee8ef1ed5fee', CURRENT_DATE - 2, 0, 1, 0, NULL, NULL, NULL),
('b455535c-9e4d-4916-b9d0-ce70f7ec4b74', '64c999ab-c5aa-4c4c-8ba5-ee8ef1ed5fee', CURRENT_DATE - 3, 1, 0, 0, CURRENT_DATE - 3 + '19:01:00'::TIME, NULL, NULL),
('b455535c-9e4d-4916-b9d0-ce70f7ec4b74', '64c999ab-c5aa-4c4c-8ba5-ee8ef1ed5fee', CURRENT_DATE - 4, 1, 0, 0, CURRENT_DATE - 4 + '19:01:00'::TIME, NULL, NULL),
('b455535c-9e4d-4916-b9d0-ce70f7ec4b74', '64c999ab-c5aa-4c4c-8ba5-ee8ef1ed5fee', CURRENT_DATE - 5, 0, 1, 0, NULL, NULL, NULL),
('b455535c-9e4d-4916-b9d0-ce70f7ec4b74', '64c999ab-c5aa-4c4c-8ba5-ee8ef1ed5fee', CURRENT_DATE - 6, 1, 0, 0, CURRENT_DATE - 6 + '19:01:00'::TIME, NULL, NULL)
ON CONFLICT (id, user_id, date) DO UPDATE SET
  taken = EXCLUDED.taken,
  to_be_taken = EXCLUDED.to_be_taken,
  skipped = EXCLUDED.skipped,
  first_intake = EXCLUDED.first_intake,
  second_intake = EXCLUDED.second_intake,
  third_intake = EXCLUDED.third_intake;