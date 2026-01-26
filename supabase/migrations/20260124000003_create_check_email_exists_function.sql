-- Create a function to check if an email already exists in profiles
-- This function uses SECURITY DEFINER to bypass RLS and check for existing emails
-- This is safe because it only returns a boolean, not sensitive data
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  email_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO email_count
  FROM public.profiles
  WHERE email = check_email;
  
  RETURN email_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;
