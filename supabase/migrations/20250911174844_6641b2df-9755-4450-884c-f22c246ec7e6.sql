-- Update the profile webhook function to change Topic header format to profile/{user_id}
CREATE OR REPLACE FUNCTION public.trigger_profile_update_webhook()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  payload JSON;
  result extensions.http_response;
  topic_value TEXT;
BEGIN
  -- Get the user_id for the topic header - changed format to profile/{user_id}
  topic_value := 'profile/' || COALESCE(NEW.id::text, OLD.id::text);
  
  payload := json_build_object(
    'operation', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'new_row', row_to_json(NEW),
    'old_row', row_to_json(OLD)
  );

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

  RETURN NEW;
END;
$function$;