CREATE OR REPLACE FUNCTION public.invoke_new_user_sync() RETURNS trigger AS $$
DECLARE result bigint;
payload jsonb;
headers jsonb;
BEGIN -- Construct the payload
payload := jsonb_build_object(
  'type',
  TG_OP,
  'record',
  row_to_json(NEW)::jsonb
);
-- Construct the headers
headers := jsonb_build_object(
  'Content-Type',
  'application/json',
  'Authorization',
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGFrcHNueXdmbnFzYW5qamJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEzNjMzNjAsImV4cCI6MjAxNjkzOTM2MH0.gDelJAwwedOfKNlTEwZAw5MrsyCpmZKjZiGmIhWC_sI'
);
-- Make the HTTP POST request
SELECT net.http_post(
    url := 'https://urxakpsnywfnqsanjjbu.supabase.co/functions/v1/new-user-sync',
    body := payload,
    headers := headers
  ) INTO result;
-- You can add error handling here if needed
-- RAISE NOTICE 'HTTP Request ID: %', result;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Recreate the trigger
DROP TRIGGER IF EXISTS new_user_calendar_sync ON auth.users;
CREATE TRIGGER new_user_calendar_sync
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.invoke_new_user_sync();
GRANT USAGE ON SCHEMA net TO postgres;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres;