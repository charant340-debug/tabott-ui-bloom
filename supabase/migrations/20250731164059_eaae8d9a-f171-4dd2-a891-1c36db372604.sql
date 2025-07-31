-- Fix the webhook function with proper HTTP request
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
    'https://webhook.site/64341731-ba31-40bd-a9c6-911d38259fd0',
    ARRAY[extensions.http_header('Content-Type', 'application/json')],
    'application/json',
    payload::text
  )) INTO result;

  RETURN NEW;
END;
$function$;