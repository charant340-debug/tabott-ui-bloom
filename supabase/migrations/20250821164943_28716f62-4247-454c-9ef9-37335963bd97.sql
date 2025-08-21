-- Set the database timezone to IST
SET timezone = 'Asia/Kolkata';

-- Update the function to work with IST timezone
CREATE OR REPLACE FUNCTION update_pill_last_taken()
RETURNS TRIGGER AS $$
DECLARE
  latest_intake TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determine the latest intake time from the three columns (all should be in IST)
  IF NEW.third_intake IS NOT NULL THEN
    latest_intake := NEW.third_intake AT TIME ZONE 'Asia/Kolkata';
  ELSIF NEW.second_intake IS NOT NULL THEN
    latest_intake := NEW.second_intake AT TIME ZONE 'Asia/Kolkata';
  ELSIF NEW.first_intake IS NOT NULL THEN
    latest_intake := NEW.first_intake AT TIME ZONE 'Asia/Kolkata';
  ELSE
    latest_intake := NULL;
  END IF;
  
  -- Update the last_taken_at column in pills table with IST timezone
  IF latest_intake IS NOT NULL THEN
    UPDATE pills 
    SET last_taken_at = latest_intake,
        updated_at = NOW() AT TIME ZONE 'Asia/Kolkata'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;