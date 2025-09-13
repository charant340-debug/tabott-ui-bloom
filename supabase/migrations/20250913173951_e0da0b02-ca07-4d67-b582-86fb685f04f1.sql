-- First, ensure no duplicate slot_names exist for any user by updating them
WITH user_pill_ranks AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rank_num
  FROM public.pills
), 
conflicting_pills AS (
  SELECT 
    p1.id,
    p1.user_id,
    p1.slot_name,
    user_pill_ranks.rank_num
  FROM public.pills p1
  JOIN user_pill_ranks ON p1.id = user_pill_ranks.id
  WHERE EXISTS (
    SELECT 1 FROM public.pills p2 
    WHERE p2.user_id = p1.user_id 
    AND p2.slot_name = p1.slot_name 
    AND p2.id != p1.id
  )
)
UPDATE public.pills 
SET slot_name = 'pill_' || conflicting_pills.rank_num
FROM conflicting_pills 
WHERE public.pills.id = conflicting_pills.id;

-- Add unique constraint to prevent duplicate slot_names per user
ALTER TABLE public.pills 
ADD CONSTRAINT pills_user_slot_unique 
UNIQUE (user_id, slot_name);