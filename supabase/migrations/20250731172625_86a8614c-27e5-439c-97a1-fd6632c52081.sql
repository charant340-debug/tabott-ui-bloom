
-- Update the webhook function with the new URL
CREATE OR REPLACE FUNCTION public.trigger_profile_update_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  payload JSON;
  result extensions.http_response;
BEGIN
  payload := json_build_object(
    'operation', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'new_row', row_to_json(NEW),
    'old_row', row_to_json(OLD)
  );

  SELECT * FROM extensions.http((
    'POST',
    'https://e1cdfa64-db08-4562-96de-3d3ea125539c-00-6piohuxx9wr6.worf.replit.dev:5000/',
    ARRAY[extensions.http_header('Content-Type', 'application/json')],
    'application/json',
    payload::text
  )) INTO result;

  RETURN NEW;
END;
$function$;
