-- Create tracking table for pill intake monitoring
CREATE TABLE public.tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pill_id UUID NOT NULL,
  date DATE NOT NULL,
  first_intake TIMESTAMP WITH TIME ZONE,
  second_intake TIMESTAMP WITH TIME ZONE,
  third_intake TIMESTAMP WITH TIME ZONE,
  taken INTEGER NOT NULL DEFAULT 0,
  to_be_taken INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one tracking record per user/pill/date combination
  UNIQUE(user_id, pill_id, date)
);

-- Add foreign key constraint to pills table
ALTER TABLE public.tracking 
ADD CONSTRAINT fk_tracking_pill_id 
FOREIGN KEY (pill_id) REFERENCES public.pills(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access
CREATE POLICY "Users can view their own tracking data" 
ON public.tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tracking data" 
ON public.tracking 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracking data" 
ON public.tracking 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracking data" 
ON public.tracking 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tracking_updated_at
BEFORE UPDATE ON public.tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tracking_user_id ON public.tracking(user_id);
CREATE INDEX idx_tracking_pill_id ON public.tracking(pill_id);
CREATE INDEX idx_tracking_date ON public.tracking(date);
CREATE INDEX idx_tracking_user_pill_date ON public.tracking(user_id, pill_id, date);