-- Optimize RLS policies by wrapping auth.uid() in subqueries
-- This prevents re-evaluation for each row and improves query performance

-- Drop and recreate profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK ((select auth.uid()) = id);

-- Drop and recreate speeches policies
DROP POLICY IF EXISTS "Users can view their own speeches" ON public.speeches;
DROP POLICY IF EXISTS "Users can create their own speeches" ON public.speeches;
DROP POLICY IF EXISTS "Users can update their own speeches" ON public.speeches;
DROP POLICY IF EXISTS "Users can delete their own speeches" ON public.speeches;

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

-- Drop and recreate analyses policies
DROP POLICY IF EXISTS "Users can view analyses for their speeches" ON public.analyses;
DROP POLICY IF EXISTS "Users can insert analyses for their speeches" ON public.analyses;
DROP POLICY IF EXISTS "Users can update analyses for their speeches" ON public.analyses;
DROP POLICY IF EXISTS "Users can delete analyses for their speeches" ON public.analyses;

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
