-- Update the pills webhook function to format times as HH:MM only
CREATE OR REPLACE FUNCTION public.trigger_pills_mqtt_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
  -- Use a subquery to handle the slot_name with fallback and format times as HH:MM
  WITH pills_with_slots AS (
    SELECT 
      p.id,
      p.interval_days,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN p.dose1_time IS NOT NULL THEN to_char(p.dose1_time, 'HH24:MI') ELSE NULL END,
        CASE WHEN p.dose2_time IS NOT NULL THEN to_char(p.dose2_time, 'HH24:MI') ELSE NULL END,
        CASE WHEN p.dose3_time IS NOT NULL THEN to_char(p.dose3_time, 'HH24:MI') ELSE NULL END
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
$function$;

-- Remove any existing triggers that might be sending detailed operation webhooks
DROP TRIGGER IF EXISTS pills_profile_update_webhook ON public.pills;
DROP TRIGGER IF EXISTS trigger_pills_profile_webhook ON public.pills;