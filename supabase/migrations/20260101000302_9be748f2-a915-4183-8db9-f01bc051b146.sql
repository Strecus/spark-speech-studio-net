-- Create speeches table for storing user speeches
CREATE TABLE public.speeches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  key_message TEXT,
  audience_demographics TEXT,
  speaker_background TEXT,
  duration_minutes INTEGER DEFAULT 10,
  tone TEXT DEFAULT 'inspiring',
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.speeches ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (users can only access their own speeches)
CREATE POLICY "Users can view their own speeches" 
ON public.speeches 
FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own speeches" 
ON public.speeches 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own speeches" 
ON public.speeches 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own speeches" 
ON public.speeches 
FOR DELETE 
USING ((select auth.uid()) = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_speeches_updated_at
BEFORE UPDATE ON public.speeches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();