-- Remove the profiles webhook trigger that's sending operation/table/schema messages
DROP TRIGGER IF EXISTS profiles_update_webhook_trigger ON public.profiles;