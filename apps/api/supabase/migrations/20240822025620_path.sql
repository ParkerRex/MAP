CREATE OR REPLACE FUNCTION public.invoke_new_user_sync() RETURNS trigger AS $$
DECLARE result RECORD;
BEGIN
SELECT * INTO result
FROM net.http_post(
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