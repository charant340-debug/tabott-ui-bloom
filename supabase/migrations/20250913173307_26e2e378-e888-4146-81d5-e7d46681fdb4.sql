-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS pills_mqtt_webhook_trigger ON public.pills;

-- Create function to send MQTT message when pills table changes
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
  SELECT json_object_agg(
    COALESCE(p.slot_name, 'pill_' || ROW_NUMBER() OVER (ORDER BY p.created_at)),
    json_build_object(
      'id', p.id,
      'interval', p.interval_days,
      'timings', ARRAY_REMOVE(ARRAY[
        p.dose1_time::text,
        p.dose2_time::text,
        p.dose3_time::text
      ], NULL),
      'pills_left', COALESCE(p.pills_count, 0),
      'Active', true
    )
  )
  INTO pills_data
  FROM public.pills p
  WHERE p.user_id = user_uuid;

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

-- Create trigger on pills table for INSERT, UPDATE, DELETE
CREATE TRIGGER pills_mqtt_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pills
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_pills_mqtt_webhook();