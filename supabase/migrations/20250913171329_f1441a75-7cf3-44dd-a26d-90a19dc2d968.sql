-- Add slot_name column to pills table
ALTER TABLE public.pills 
ADD COLUMN slot_name TEXT;