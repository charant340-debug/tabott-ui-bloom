-- Add device_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN device_id TEXT;

-- Add unique constraint to ensure each device ID is unique
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_device_id UNIQUE (device_id);