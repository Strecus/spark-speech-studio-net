-- Add description fields to analyses table for logos, pathos, and ethos
ALTER TABLE public.analyses
ADD COLUMN IF NOT EXISTS logos_description TEXT,
ADD COLUMN IF NOT EXISTS pathos_description TEXT,
ADD COLUMN IF NOT EXISTS ethos_description TEXT;

