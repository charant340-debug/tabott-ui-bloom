-- Create pills table to store pill information
CREATE TABLE public.pills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 0,
  dose1_time TIME,
  dose2_time TIME,
  dose3_time TIME,
  pills_count INTEGER DEFAULT 0,
  snooze_duration TEXT DEFAULT '30 mins',
  last_taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pills ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own pills" 
ON public.pills 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pills" 
ON public.pills 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pills" 
ON public.pills 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pills" 
ON public.pills 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pills_updated_at
BEFORE UPDATE ON public.pills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for 8 pills
INSERT INTO public.pills (user_id, name, interval_days, dose1_time, dose2_time, dose3_time, pills_count, snooze_duration, last_taken_at) VALUES
('00000000-0000-0000-0000-000000000000', 'Vitamin D3', 0, '08:00', '14:00', null, 30, '30 mins', '2025-07-10 14:30:00+00'),
('00000000-0000-0000-0000-000000000000', 'Omega-3', 0, '09:00', '21:00', null, 60, '1 hr', '2025-07-11 09:00:00+00'),
('00000000-0000-0000-0000-000000000000', 'Multivitamin', 0, '07:30', null, null, 90, '30 mins', '2025-07-12 07:30:00+00'),
('00000000-0000-0000-0000-000000000000', 'Calcium', 1, '10:00', '22:00', null, 45, '45 mins', '2025-07-09 22:00:00+00'),
('00000000-0000-0000-0000-000000000000', 'Iron', 0, '08:30', '20:30', null, 25, '1 hr', '2025-07-12 20:30:00+00'),
('00000000-0000-0000-0000-000000000000', 'Magnesium', 0, '19:00', null, null, 50, '30 mins', '2025-07-11 19:00:00+00'),
('00000000-0000-0000-0000-000000000000', 'Zinc', 2, '12:00', null, null, 40, '2 hr', '2025-07-10 12:00:00+00'),
('00000000-0000-0000-0000-000000000000', 'Vitamin B12', 0, '09:30', '15:30', '21:30', 35, '1 hr', '2025-07-12 21:30:00+00');