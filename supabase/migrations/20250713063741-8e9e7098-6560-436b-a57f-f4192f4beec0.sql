-- Add additional profile fields
ALTER TABLE public.profiles 
ADD COLUMN age INTEGER,
ADD COLUMN blood_group TEXT,
ADD COLUMN height_cm INTEGER,
ADD COLUMN contact_no TEXT;