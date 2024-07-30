-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- Create custom types
CREATE TYPE "public"."integration_provider" AS ENUM ('WHOOP', 'GOOGLE');
CREATE TYPE "public"."source" AS ENUM ('agent', 'user');

-- Create tables
CREATE TABLE IF NOT EXISTS "public"."profile" (
    "id" UUID PRIMARY KEY,
    "updated_at" TIMESTAMPTZ,
    "username" TEXT UNIQUE,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "website" TEXT,
    "timezone" TEXT,
    CONSTRAINT "username_length" CHECK (char_length(username) >= 3)
);

CREATE TABLE IF NOT EXISTS "public"."calendar" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "google_calendar_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "time_zone" TEXT,
    "color_id" TEXT,
    "background_color" VARCHAR(7),
    "foreground_color" VARCHAR(7),
    "etag" TEXT,
    "summary_override" TEXT,
    "hidden" BOOLEAN,
    "selected" BOOLEAN,
    "access_role" VARCHAR(50),
    "default_reminders" JSONB,
    "notification_settings" JSONB,
    "is_primary" BOOLEAN,
    "deleted" BOOLEAN,
    "conference_properties" JSONB,
    "use_polling" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now(),
    "sync_token" TEXT,
    "sync_method" TEXT NOT NULL DEFAULT 'webhook',
    CONSTRAINT "unique_google_calendar_id_user_id" UNIQUE (google_calendar_id, user_id)
);

CREATE TABLE IF NOT EXISTS "public"."calendar_event" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "google_event_id" TEXT NOT NULL,
    "calendar_id" UUID,
    "user_id" UUID NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "all_day" BOOLEAN DEFAULT false,
    "recurring_event_id" TEXT,
    "recurrence" TEXT[],
    "location" TEXT,
    "creator" JSONB,
    "organizer" JSONB,
    "attendees" JSONB,
    "reminders" JSONB,
    "color_id" TEXT,
    "visibility" TEXT,
    "status" TEXT,
    "transparency" VARCHAR(50),
    "ical_uid" VARCHAR(255),
    "sequence" INTEGER,
    "event_type" VARCHAR(50),
    "attachments" JSONB,
    "anyone_can_add_self" BOOLEAN,
    "guests_can_invite_others" BOOLEAN,
    "guests_can_modify" BOOLEAN,
    "guests_can_see_other_guests" BOOLEAN,
    "private_copy" BOOLEAN,
    "is_locked" BOOLEAN,
    "source" JSONB,
    "original_start_time" JSONB,
    "created" TIMESTAMPTZ,
    "updated" TIMESTAMPTZ,
    "extended_properties" JSONB,
    "hangout_link" TEXT,
    "html_link" TEXT,
    "conference_data" JSONB,
    "etag" TEXT,
    "attendees_omitted" BOOLEAN,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now(),
    "last_synced_at" TIMESTAMPTZ DEFAULT now(),
    "needs_sync" BOOLEAN DEFAULT false,
    CONSTRAINT "unique_google_event_id_user_id" UNIQUE (google_event_id, user_id)
);

CREATE TABLE IF NOT EXISTS "public"."contact" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "company" TEXT,
    "contact_name" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "user_id" UUID DEFAULT auth.uid()
);

CREATE TABLE IF NOT EXISTS "public"."folder" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."goal" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID DEFAULT auth.uid() NOT NULL,
    "title" TEXT,
    "completed" BOOLEAN DEFAULT false,
    "due_at" TIMESTAMPTZ NOT NULL,
    "source" public.source DEFAULT 'user'::public.source NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "goals_due_date_check" CHECK (due_at > now())
);

CREATE TABLE IF NOT EXISTS "public"."header" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "user_id" UUID DEFAULT auth.uid() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now(),
    "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "public"."integration" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" public.integration_provider NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS "public"."note" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR,
    "content" TEXT,
    "user_id" UUID NOT NULL,
    "folder_id" UUID NOT NULL,
    "shared" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."project" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT,
    "description" TEXT,
    "user_id" UUID DEFAULT auth.uid() NOT NULL,
    "project_position" BIGINT,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now(),
    "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "public"."shared_note" (
    "note_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    PRIMARY KEY (note_id, user_id)
);

CREATE TABLE IF NOT EXISTS "public"."tag" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL UNIQUE,
    "user_id" UUID DEFAULT auth.uid()
);

CREATE TABLE IF NOT EXISTS "public"."tag_task" (
    "tag_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "parent_id" UUID,
    PRIMARY KEY (tag_id, task_id),
    UNIQUE (tag_id, task_id)
);

CREATE TABLE IF NOT EXISTS "public"."task" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "body" TEXT,
    "resources" TEXT[],
    "source_type" public.source DEFAULT 'user'::public.source NOT NULL,
    "proposal" TEXT,
    "cognitive_load" SMALLINT,
    "result" TEXT,
    "blocked_by" UUID,
    "contact_id" UUID,
    "created_by" UUID DEFAULT auth.uid() NOT NULL,
    "updated_by" UUID DEFAULT auth.uid() NOT NULL,
    "deleted_by" UUID,
    "completed_by" UUID,
    "assigned_to" UUID DEFAULT auth.uid(),
    "project_id" UUID,
    "header_id" UUID,
    "task_position" BIGINT,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "due_at" TIMESTAMPTZ,
    "scheduled_for" TIMESTAMPTZ,
    "estimated_duration" INTERVAL,
    "actual_duration" INTERVAL
);

CREATE TABLE IF NOT EXISTS "public"."calendar_sync_info" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "google_calendar_id" TEXT NOT NULL,
    "channel_id" TEXT,
    "resource_id" TEXT,
    "expiration" TIMESTAMPTZ,
    "sync_token" TEXT,
    "last_sync_time" TIMESTAMPTZ,
    "sync_method" TEXT NOT NULL DEFAULT 'webhook',
    UNIQUE(user_id, google_calendar_id)
);

CREATE TABLE IF NOT EXISTS "public"."sync_job" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB,
    "job_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now(),
    "error_message" TEXT,
    "calendars_synced" INTEGER,
    "events_synced" INTEGER
);

CREATE TABLE IF NOT EXISTS "public"."webhook_channel" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "google_calendar_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "resource_id" TEXT,
    "expiration" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, google_calendar_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_calendar_event_calendar_id" ON "public"."calendar_event" USING btree ("calendar_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_event_end_time" ON "public"."calendar_event" USING btree ("end_time");
CREATE INDEX IF NOT EXISTS "idx_calendar_event_start_time" ON "public"."calendar_event" USING btree ("start_time");
CREATE INDEX IF NOT EXISTS "idx_calendar_event_user_id" ON "public"."calendar_event" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_integration_provider" ON "public"."integration" USING btree ("provider");
CREATE INDEX IF NOT EXISTS "idx_integration_user_id" ON "public"."integration" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sync_job_user_id" ON "public"."sync_job" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sync_job_status" ON "public"."sync_job" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_token" ON "public"."calendar" USING btree ("sync_token");
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_info_sync_method" ON "public"."calendar_sync_info" USING btree ("sync_method");
CREATE INDEX IF NOT EXISTS "idx_calendar_event_google_event_id" ON "public"."calendar_event" USING btree ("google_event_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_info_user_id" ON "public"."calendar_sync_info" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_info_google_calendar_id" ON "public"."calendar_sync_info" USING btree ("google_calendar_id");
CREATE INDEX IF NOT EXISTS "idx_webhook_channel_user_id" ON "public"."webhook_channel" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_webhook_channel_google_calendar_id" ON "public"."webhook_channel" USING btree ("google_calendar_id");

-- Create functions
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile (id, username, full_name, avatar_url, website, timezone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'website', 'UTC')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION "public"."sync_calendars"(
  user_id UUID,
  calendars JSONB
) RETURNS JSONB AS $$
DECLARE
  calendar JSONB;
  calendars_synced INT := 0;
BEGIN
  FOR calendar IN SELECT * FROM jsonb_array_elements(calendars)
  LOOP
    INSERT INTO public.calendar (
      google_calendar_id, user_id, summary, description, time_zone,
      background_color, foreground_color, selected, is_primary
    ) VALUES (
      (calendar->>'id')::TEXT,
      user_id,
      calendar->>'summary',
      calendar->>'description',
      calendar->>'timeZone',
      calendar->>'backgroundColor',
      calendar->>'foregroundColor',
      COALESCE((calendar->>'selected')::BOOLEAN, FALSE),
      COALESCE((calendar->>'primary')::BOOLEAN, FALSE)
    )
    ON CONFLICT (google_calendar_id, user_id) DO UPDATE SET
      summary = EXCLUDED.summary,
      description = EXCLUDED.description,
      time_zone = EXCLUDED.time_zone,
      background_color = EXCLUDED.background_color,
      foreground_color = EXCLUDED.foreground_color,
      selected = EXCLUDED.selected,
      is_primary = EXCLUDED.is_primary,
      updated_at = NOW();

    calendars_synced := calendars_synced + 1;
  END LOOP;

  RETURN jsonb_build_object('calendars_synced', calendars_synced);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "public"."sync_events"(
  user_id UUID,
  calendar_id TEXT,
  events JSONB
) RETURNS JSONB AS $$
DECLARE
  event JSONB;
  events_synced INT := 0;
BEGIN
  FOR event IN SELECT * FROM jsonb_array_elements(events)
  LOOP
    INSERT INTO public.calendar_event (
      google_event_id, calendar_id, user_id, summary, description,
      start_time, end_time, all_day, recurring_event_id, recurrence,
      location, organizer, attendees, reminders, color_id,
      visibility, status, created, updated, etag
    ) VALUES (
      event->>'id',
      calendar_id,
      user_id,
      event->>'summary',
      event->>'description',
      (event->'start'->>'dateTime')::TIMESTAMPTZ,
      (event->'end'->>'dateTime')::TIMESTAMPTZ,
      COALESCE((event->>'all_day')::BOOLEAN, FALSE),
      event->>'recurring_event_id',
      (event->>'recurrence')::TEXT[],
      event->>'location',
      event->'organizer',
      event->'attendees',
      event->'reminders',
      event->>'color_id',
      event->>'visibility',
      event->>'status',
      (event->>'created')::TIMESTAMPTZ,
      (event->>'updated')::TIMESTAMPTZ,
      event->>'etag'
    )
    ON CONFLICT (google_event_id, user_id) DO UPDATE SET
      calendar_id = EXCLUDED.calendar_id,
      summary = EXCLUDED.summary,
      description = EXCLUDED.description,
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      all_day = EXCLUDED.all_day,
      recurring_event_id = EXCLUDED.recurring_event_id,
      recurrence = EXCLUDED.recurrence,
      location = EXCLUDED.location,
      organizer = EXCLUDED.organizer,
      attendees = EXCLUDED.attendees,
      reminders = EXCLUDED.reminders,
      color_id = EXCLUDED.color_id,
      visibility = EXCLUDED.visibility,
      status = EXCLUDED.status,
      created = EXCLUDED.created,
      updated = EXCLUDED.updated,
      etag = EXCLUDED.etag,
      updated_at = NOW();

    events_synced := events_synced + 1;
  END LOOP;

  RETURN jsonb_build_object('events_synced', events_synced);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "public"."update_modified_column"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "public"."update_task_tags"(task_id UUID, tag_titles TEXT[])
RETURNS VOID AS $$
DECLARE
  tag_id UUID;
BEGIN
  DELETE FROM tag_task WHERE task_id = task_id;
  
  FOR i IN 1..array_length(tag_titles, 1) LOOP
    SELECT id INTO tag_id FROM tag WHERE title = tag_titles[i];
    IF tag_id IS NULL THEN
      INSERT INTO tag (title) VALUES (tag_titles[i]) RETURNING id INTO tag_id;
    END IF;
    
    INSERT INTO tag_task (task_id, tag_id) VALUES (task_id, tag_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_and_start_sync_job(
  p_user_id UUID,
  p_job_type TEXT
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  status TEXT,
  job_type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  error_message TEXT,
  calendars_synced INTEGER,
  events_synced INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH updated_job AS (
    UPDATE sync_job
    SET updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'in_progress'
    RETURNING *
  ),
  new_job AS (
    INSERT INTO sync_job (user_id, status, job_type)
    SELECT p_user_id, 'in_progress', p_job_type
    WHERE NOT EXISTS (SELECT 1 FROM updated_job)
    RETURNING *
  )
  SELECT * FROM updated_job
  UNION ALL
  SELECT * FROM new_job;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sync_job_status(
  job_id UUID,
  status TEXT,
  error_message TEXT DEFAULT NULL,
  calendars_synced INTEGER DEFAULT NULL,
  events_synced INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE public.sync_job
  SET 
    status = status,
    error_message = error_message,
    calendars_synced = calendars_synced,
    events_synced = events_synced,
    updated_at = NOW()
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER "goal_updated_at"
BEFORE UPDATE ON "public"."goal"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_modified_column"();

CREATE TRIGGER "update_calendar_event_modtime"
BEFORE UPDATE ON "public"."calendar_event"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_modified_column"();

CREATE TRIGGER "update_calendar_modtime"
BEFORE UPDATE ON "public"."calendar"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_modified_column"();

CREATE TRIGGER "update_integration_modtime"
BEFORE UPDATE ON "public"."integration"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_modified_column"();

CREATE TRIGGER "on_auth_user_created"
AFTER INSERT ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION "public"."handle_new_user"();

-- Set up RLS policies
ALTER TABLE "public"."goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."header" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."integration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."calendar_sync_info" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sync_job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."webhook_channel" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated user to view & modify their own data" ON "public"."goal"
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated user to view & modify their own data" ON "public"."header"
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated user to view & modify their own data" ON "public"."project"
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profile"
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON "public"."profile"
  FOR INSERT WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update own profile." ON "public"."profile"
  FOR UPDATE USING ((auth.uid() = id));

CREATE POLICY "Users can view their own integrations" ON "public"."integration"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations" ON "public"."integration"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" ON "public"."integration"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" ON "public"."integration"
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own calendar sync info" ON public.calendar_sync_info
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar sync info" ON public.calendar_sync_info
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar sync info" ON public.calendar_sync_info
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar sync info" ON public.calendar_sync_info
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sync jobs" ON public.sync_job
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync jobs" ON public.sync_job
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync jobs" ON public.sync_job
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own webhook channels" ON public.webhook_channel
  FOR ALL USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE "public"."calendar_event"
  ADD CONSTRAINT "calendar_event_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendar"("id"),
  ADD CONSTRAINT "calendar_event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."calendar"
  ADD CONSTRAINT "calendar_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."contact"
  ADD CONSTRAINT "contact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE "public"."integration"
  ADD CONSTRAINT "integration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."profile"
  ADD CONSTRAINT "profile_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");

ALTER TABLE "public"."folder"
  ADD CONSTRAINT "folder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

ALTER TABLE "public"."goal"
  ADD CONSTRAINT "goal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."header"
  ADD CONSTRAINT "header_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;

ALTER TABLE "public"."note"
  ADD CONSTRAINT "note_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id"),
  ADD CONSTRAINT "note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE "public"."project"
  ADD CONSTRAINT "project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;

ALTER TABLE "public"."task"
  ADD CONSTRAINT "task_header_id_fkey" FOREIGN KEY ("header_id") REFERENCES "public"."header"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;

ALTER TABLE "public"."shared_note"
  ADD CONSTRAINT "shared_note_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."note"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "shared_note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."tag_task"
  ADD CONSTRAINT "tag_task_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."tag"("id"),
  ADD CONSTRAINT "tag_task_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id"),
  ADD CONSTRAINT "tag_task_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id");

ALTER TABLE "public"."tag"
  ADD CONSTRAINT "tag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE "public"."task"
  ADD CONSTRAINT "task_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id"),
  ADD CONSTRAINT "task_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "public"."task"("id"),
  ADD CONSTRAINT "task_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "auth"."users"("id"),
  ADD CONSTRAINT "task_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id"),
  ADD CONSTRAINT "task_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id"),
  ADD CONSTRAINT "task_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id"),
  ADD CONSTRAINT "task_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");

ALTER TABLE "public"."calendar_sync_info"
  ADD CONSTRAINT "calendar_sync_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."sync_job"
  ADD CONSTRAINT "sync_job_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";

-- Set default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "postgres", "anon", "authenticated", "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "postgres", "anon", "authenticated", "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "postgres", "anon", "authenticated", "service_role";

COMMENT ON SCHEMA "public" IS 'standard public schema';

-- Add publication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_event;
ALTER PUBLICATION supabase_realtime ADD TABLE sync_job;