-- Enable pgcron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA public;
GRANT USAGE ON SCHEMA cron TO public;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO public;
-- Create a function to handle the webhook call
CREATE OR REPLACE FUNCTION public.new_user_webhook() RETURNS trigger AS $$ BEGIN PERFORM supabase_functions.http_request(
    'http://localhost:8080/sync-calendars',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer HtKAE/nFzw/ofUc5+i9XLFTdOInUdWm3pgHW2L8n/Jo="}',
    format(
      '{"type": "INSERT", "table": "auth.users", "record": {"id": "%s", "email": "%s"}}',
      NEW.id,
      NEW.email
    ),
    1000
  );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create the trigger that uses the function
CREATE TRIGGER new_user_calendar_sync
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.new_user_webhook();
-- The rest of your SQL remains the same
CREATE OR REPLACE FUNCTION public.sync_all_user_calendars() RETURNS void AS $$
DECLARE user_record RECORD;
BEGIN FOR user_record IN
SELECT id
FROM auth.users LOOP PERFORM supabase_functions.http_request(
    'http://localhost:8080/sync-calendars',
    'POST',
    '{"Content-Type":"application/json"}',
    json_build_object(
      'type',
      'PERIODIC',
      'record',
      json_build_object('id', user_record.id)
    )::text,
    1000
  );
END LOOP;
END;
$$ LANGUAGE plpgsql;
-- Schedule the function to run daily using pgcron
-- Enable the pg_cron extension
-- Enable pgcron extension (if not already enabled)
-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO public;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO public;
-- Check if the cron job already exists and drop it if it does
DO $$ BEGIN IF EXISTS (
  SELECT 1
  FROM cron.job
  WHERE jobname = 'nightly-calendar-sync'
) THEN PERFORM cron.unschedule('nightly-calendar-sync');
END IF;
END $$;
-- Schedule the nightly sync function to run daily at 2 AM UTC
SELECT cron.schedule(
    'nightly-calendar-sync',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url := 'https://urxakpsnywfnqsanjjbu.supabase.co/functions/v1/nightly-sync',
        headers := '{"Content-Type": "application/json", "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGFrcHNueXdmbnFzYW5qamJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEzNjMzNjAsImV4cCI6MjAxNjkzOTM2MH0.gDelJAwwedOfKNlTEwZAw5MrsyCpmZKjZiGmIhWC_sI"}'
      ) $$
  );