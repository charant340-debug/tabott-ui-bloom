-- Update pills to be owned by the authenticated user (this is just for demo purposes)
-- In a real app, you'd create pills properly for each user
UPDATE public.pills 
SET user_id = '64c999ab-c5aa-4c4c-8ba5-ee8ef1ed5fee'
WHERE user_id = '00000000-0000-0000-0000-000000000000';