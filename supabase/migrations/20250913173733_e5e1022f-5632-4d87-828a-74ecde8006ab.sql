-- Fix the MQTT webhook function to avoid window function error
CREATE OR REPLACE FUNCTION public.trigger_pills_mqtt_webhook()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  result extensions.http_response;
  topic_value TEXT;
  user_uuid UUID;
  pills_data JSON;
BEGIN
  -- Get the user_id from the affected row
  user_uuid := COALESCE(NEW.user_id, OLD.user_id);
  
  -- Set the topic header format to schedule/{user_id}
  topic_value := 'schedule/' || user_uuid::text;
  
  -- Query all pills for this user and format them according to the specified structure
  -- Use a subquery to handle the slot_name with fallback
  WITH pills_with_slots AS (
    SELECT 
      p.id,
      p.interval_days,
      ARRAY_REMOVE(ARRAY[
        p.dose1_time::text,
        p.dose2_time::text,
        p.dose3_time::text
      ], NULL) as timings,
      COALESCE(p.pills_count, 0) as pills_left,
      COALESCE(p.slot_name, 'pill_' || ROW_NUMBER() OVER (ORDER BY p.created_at)) as slot_key
    FROM public.pills p
    WHERE p.user_id = user_uuid
  )
  SELECT json_object_agg(
    slot_key,
    json_build_object(
      'id', id,
      'interval', interval_days,
      'timings', timings,
      'pills_left', pills_left,
      'Active', true
    )
  )
  INTO pills_data
  FROM pills_with_slots;

  -- Create the payload - if no pills, send empty object
  payload := COALESCE(pills_data, '{}'::json);

  -- Send the HTTP request to the MQTT endpoint
  SELECT * FROM extensions.http((
    'POST',
    'https://429f0396-ad22-4bda-a079-6c8e3bb00733-00-h0o800qsau06.kirk.replit.dev/send-mqtt',
    ARRAY[
      extensions.http_header('Content-Type', 'application/json'),
      extensions.http_header('Topic', topic_value)
    ],
    'application/json',
    payload::text
  )) INTO result;

  -- Log the result for debugging
  RAISE LOG 'MQTT webhook sent for user %, topic: %, status: %', user_uuid, topic_value, result.status;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Now update existing pills to assign slot names based on creation order
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