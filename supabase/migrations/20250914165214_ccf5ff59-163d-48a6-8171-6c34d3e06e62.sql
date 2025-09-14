-- Create trigger to automatically update pills.last_taken_at when tracking data is inserted or updated
DROP TRIGGER IF EXISTS trigger_update_pill_last_taken ON public.tracking;

CREATE TRIGGER trigger_update_pill_last_taken
  AFTER INSERT OR UPDATE ON public.tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pill_last_taken();