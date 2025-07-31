-- Update the webhook function to use the correct http extension
CREATE OR REPLACE FUNCTION public.trigger_profile_update_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  payload JSON;
BEGIN
  payload := json_build_object(
    'operation', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'new_row', row_to_json(NEW),
    'old_row', row_to_json(OLD)
  );

  PERFORM extensions.http_post(
    url := 'https://webhook.site/64341731-ba31-40bd-a9c6-911d38259fd0',
    headers := json_build_object('Content-Type', 'application/json'),
    body := payload::text
  );

  RETURN NEW;
END;
$function$;