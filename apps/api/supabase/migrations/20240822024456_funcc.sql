-- First, ensure pg_net extension is created
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Then, update or create the function
CREATE OR REPLACE FUNCTION public.invoke_new_user_sync() RETURNS trigger AS $$
DECLARE result RECORD;
BEGIN
SELECT * INTO result
FROM pg_net.http_post(
    url := 'https://urxakpsnywfnqsanjjbu.supabase.co/functions/v1/new-user-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGFrcHNueXdmbnFzYW5qamJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEzNjMzNjAsImV4cCI6MjAxNjkzOTM2MH0.gDelJAwwedOfKNlTEwZAw5MrsyCpmZKjZiGmIhWC_sI"}',
    body := json_build_object(
      'type',
      TG_OP,
      'record',
      row_to_json(NEW)
    )::text
  );
-- You can add error handling here if needed
-- RAISE NOTICE 'HTTP Response: %', result;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Recreate the trigger
DROP TRIGGER IF EXISTS new_user_calendar_sync ON auth.users;
CREATE TRIGGER new_user_calendar_sync
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.invoke_new_user_sync();