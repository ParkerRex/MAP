DROP TRIGGER IF EXISTS new_user_calendar_sync ON auth.users;
DROP FUNCTION IF EXISTS public.new_user_webhook();
-- Create a function to invoke the Edge Function
CREATE OR REPLACE FUNCTION public.invoke_new_user_sync() RETURNS trigger AS $$ BEGIN PERFORM net.http_post(
    url := 'https://urxakpsnywfnqsanjjbu.supabase.co/functions/v1/new-user-sync',
    headers := '{
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGFrcHNueXdmbnFzYW5qamJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEzNjMzNjAsImV4cCI6MjAxNjkzOTM2MH0.gDelJAwwedOfKNlTEwZAw5MrsyCpmZKjZiGmIhWC_sI"
      }',
    body := json_build_object(
      'type',
      TG_OP,
      'record',
      row_to_json(NEW)
    )::text
  );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create the trigger
CREATE TRIGGER new_user_sync_trigger
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.invoke_new_user_sync();