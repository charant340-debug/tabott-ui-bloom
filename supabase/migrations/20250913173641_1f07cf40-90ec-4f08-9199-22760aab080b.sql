-- Update existing pills to assign slot names based on creation order
WITH numbered_pills AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.pills 
  WHERE slot_name IS NULL
)
UPDATE public.pills 
SET slot_name = 'pill_' || numbered_pills.row_num
FROM numbered_pills 
WHERE public.pills.id = numbered_pills.id;