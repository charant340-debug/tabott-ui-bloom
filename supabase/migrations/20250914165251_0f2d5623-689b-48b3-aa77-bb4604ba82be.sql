-- Fix the search_path issue for the update_pill_last_taken function
CREATE OR REPLACE FUNCTION public.update_pill_last_taken()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$