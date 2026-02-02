-- Create function to check if an email exists and if it's registered
-- Used to restrict password reset to registered (verified) accounts only
CREATE OR REPLACE FUNCTION public.get_email_registration_status(check_email TEXT)
RETURNS TABLE(email_exists BOOLEAN, is_registered BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (p.id IS NOT NULL) AS email_exists,
    COALESCE(p.registered, false) AS is_registered
  FROM (SELECT 1) dummy
  LEFT JOIN public.profiles p ON p.email = check_email
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_email_registration_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_registration_status(TEXT) TO anon;
