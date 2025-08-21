-- Create function to update last_taken_at in pills table
CREATE OR REPLACE FUNCTION update_pill_last_taken()
RETURNS TRIGGER AS $$
DECLARE
  latest_intake TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determine the latest intake time from the three columns
  IF NEW.third_intake IS NOT NULL THEN
    latest_intake := NEW.third_intake;
  ELSIF NEW.second_intake IS NOT NULL THEN
    latest_intake := NEW.second_intake;
  ELSIF NEW.first_intake IS NOT NULL THEN
    latest_intake := NEW.first_intake;
  ELSE
    latest_intake := NULL;
  END IF;
  
  -- Update the last_taken_at column in pills table
  IF latest_intake IS NOT NULL THEN
    UPDATE pills 
    SET last_taken_at = latest_intake
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_taken_at when tracking data changes
CREATE TRIGGER update_pill_last_taken_trigger
  AFTER INSERT OR UPDATE ON tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_pill_last_taken();