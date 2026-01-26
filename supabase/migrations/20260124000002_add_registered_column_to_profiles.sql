-- Add registered column to profiles table
-- This tracks whether the user has verified their email (registered)
-- false = new user who hasn't verified email yet
-- true = user has verified their email
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS registered BOOLEAN NOT NULL DEFAULT false;

-- Update the trigger function to set registered based on email confirmation status
-- New users start with registered = false (email not confirmed yet)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, registered)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'first_name',
    -- Set registered to true only if email is already confirmed (rare case)
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to update registered status when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Update registered to true when email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) THEN
    UPDATE public.profiles
    SET registered = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update registered status when email is confirmed
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at))
  EXECUTE FUNCTION public.handle_email_confirmed();

-- Update existing users: set registered = true if email is already confirmed
UPDATE public.profiles
SET registered = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL
)
AND registered = false;
