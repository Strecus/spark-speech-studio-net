-- Create analyses table for storing speech rhetorical analysis
-- One-to-one relationship with speeches table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  speech_id UUID NOT NULL UNIQUE REFERENCES public.speeches(id) ON DELETE CASCADE,
  logos INTEGER NOT NULL CHECK (logos >= 0 AND logos <= 100),
  pathos INTEGER NOT NULL CHECK (pathos >= 0 AND pathos <= 100),
  ethos INTEGER NOT NULL CHECK (ethos >= 0 AND ethos <= 100),
  logos_description TEXT,
  pathos_description TEXT,
  ethos_description TEXT,
  overall_score INTEGER GENERATED ALWAYS AS (
    ROUND((logos + pathos + ethos) / 3.0)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for analyses
-- Users can view analyses for speeches they own
CREATE POLICY "Users can view analyses for their speeches"
ON public.analyses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.speeches
    WHERE speeches.id = analyses.speech_id
    AND speeches.user_id = (select auth.uid())
  )
);

-- Users can insert analyses for speeches they own
CREATE POLICY "Users can insert analyses for their speeches"
ON public.analyses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.speeches
    WHERE speeches.id = analyses.speech_id
    AND speeches.user_id = (select auth.uid())
  )
);

-- Users can update analyses for speeches they own
CREATE POLICY "Users can update analyses for their speeches"
ON public.analyses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.speeches
    WHERE speeches.id = analyses.speech_id
    AND speeches.user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.speeches
    WHERE speeches.id = analyses.speech_id
    AND speeches.user_id = (select auth.uid())
  )
);

-- Users can delete analyses for speeches they own
CREATE POLICY "Users can delete analyses for their speeches"
ON public.analyses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.speeches
    WHERE speeches.id = analyses.speech_id
    AND speeches.user_id = (select auth.uid())
  )
);

-- Create function to update timestamps for analyses
CREATE OR REPLACE FUNCTION public.update_analyses_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on analyses
CREATE TRIGGER update_analyses_updated_at
BEFORE UPDATE ON public.analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_analyses_updated_at_column();

-- Create index on speech_id for faster lookups (though UNIQUE constraint already creates an index)
CREATE INDEX IF NOT EXISTS idx_analyses_speech_id ON public.analyses(speech_id);

