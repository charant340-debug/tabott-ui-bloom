-- Create trigger for pills table to send webhook on changes
CREATE TRIGGER trigger_pills_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.pills
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_profile_update_webhook();