-- Ensure function sets search_path and formats HH:MM
CREATE OR REPLACE FUNCTION public.trigger_pills_mqtt_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
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
  
  -- Build payload of all pills with HH:MM timings only
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

  payload := COALESCE(pills_data, '{}'::json);

  -- Single MQTT call only with schedule payload
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

  RAISE LOG 'MQTT schedule sent for user %, topic: %, status: %', user_uuid, topic_value, result.status;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Drop ALL existing non-internal triggers on public.pills to prevent duplicate webhooks
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN 
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'pills' AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.pills;', r.tgname);
  END LOOP;
END $$;

-- Re-create ONLY the intended triggers
-- 1) Schedule MQTT trigger
CREATE TRIGGER trg_pills_schedule_mqtt
AFTER INSERT OR UPDATE OR DELETE ON public.pills
FOR EACH ROW EXECUTE FUNCTION public.trigger_pills_mqtt_webhook();

-- 2) Keep updated_at in sync on updates
DROP TRIGGER IF EXISTS update_pills_updated_at ON public.pills;
CREATE TRIGGER update_pills_updated_at
BEFORE UPDATE ON public.pills
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();