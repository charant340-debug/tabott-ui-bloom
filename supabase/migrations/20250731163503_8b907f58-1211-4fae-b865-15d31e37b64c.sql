-- Create trigger to send profile updates to webhook
CREATE TRIGGER profiles_update_webhook_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.trigger_profile_update_webhook();