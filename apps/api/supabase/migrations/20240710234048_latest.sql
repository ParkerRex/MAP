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
CREATE TABLE IF NOT EXISTS "public"."users" (
  "id" UUID PRIMARY KEY,
  "full_name" TEXT,
  "avatar_url" TEXT,
  "website" TEXT,
  "timezone" TEXT,
  "updated_at" TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS "public"."calendars" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "google_calendar_id" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "summary" TEXT,
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
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT "unique_google_calendar_id_user_id" UNIQUE (google_calendar_id, user_id)
);
CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
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
  "recurrence" TEXT [],
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
  CONSTRAINT "unique_google_event_id_user_id" UNIQUE (google_event_id, user_id)
);
CREATE TABLE IF NOT EXISTS "public"."folder" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "public"."goals" (
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
CREATE TABLE IF NOT EXISTS "public"."headers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "user_id" UUID DEFAULT auth.uid() NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS "public"."integrations" (
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
CREATE TABLE IF NOT EXISTS "public"."notes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR,
  "content" TEXT,
  "user_id" UUID NOT NULL,
  "folder_id" UUID NOT NULL,
  "shared" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "public"."projects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT,
  "description" TEXT,
  "user_id" UUID DEFAULT auth.uid() NOT NULL,
  "project_position" BIGINT,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS "public"."tags" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL UNIQUE,
  "user_id" UUID DEFAULT auth.uid()
);
CREATE TABLE IF NOT EXISTS "public"."tag_tasks" (
  "tag_id" UUID NOT NULL,
  "task_id" UUID NOT NULL,
  "parent_id" UUID,
  PRIMARY KEY (tag_id, task_id),
  UNIQUE (tag_id, task_id)
);
CREATE TABLE IF NOT EXISTS "public"."tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "body" TEXT,
  "resources" TEXT [],
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
-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_calendar_event_calendar_id" ON "public"."calendar_events" USING btree ("calendar_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_event_end_time" ON "public"."calendar_events" USING btree ("end_time");
CREATE INDEX IF NOT EXISTS "idx_calendar_event_start_time" ON "public"."calendar_events" USING btree ("start_time");
CREATE INDEX IF NOT EXISTS "idx_calendar_event_user_id" ON "public"."calendar_events" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_integration_provider" ON "public"."integrations" USING btree ("provider");
CREATE INDEX IF NOT EXISTS "idx_integration_user_id" ON "public"."integrations" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_event_google_event_id" ON "public"."calendar_events" USING btree ("google_event_id");
-- Create functions
CREATE OR REPLACE FUNCTION "public"."sync_calendar"(
    "p_user_id" "uuid",
    "p_calendars" "jsonb",
    "p_events" "jsonb"
  ) RETURNS "jsonb" LANGUAGE "plpgsql" SECURITY DEFINER AS $$
DECLARE v_calendar JSONB;
v_event JSONB;
v_calendars_synced INT := 0;
v_events_synced INT := 0;
BEGIN -- Sync calendars
FOR v_calendar IN
SELECT *
FROM jsonb_array_elements(p_calendars) LOOP
INSERT INTO calendars (
    id,
    google_calendar_id,
    summary,
    description,
    time_zone,
    color_id,
    background_color,
    foreground_color,
    summary_override,
    etag,
    hidden,
    selected,
    access_role,
    default_reminders,
    notification_settings,
    is_primary,
    deleted,
    conference_properties,
    user_id
  )
VALUES (
    COALESCE(
      (v_calendar->>'id')::TEXT,
      gen_random_uuid()::TEXT
    ),
    (v_calendar->>'id')::TEXT,
    (v_calendar->>'summary')::TEXT,
    (v_calendar->>'description')::TEXT,
    (v_calendar->>'timeZone')::TEXT,
    (v_calendar->>'colorId')::TEXT,
    (v_calendar->>'backgroundColor')::TEXT,
    (v_calendar->>'foregroundColor')::TEXT,
    (v_calendar->>'etag')::TEXT,
    (v_calendar->>'summaryOverride')::TEXT,
    (v_calendar->>'hidden')::BOOLEAN,
    (v_calendar->>'selected')::BOOLEAN,
    (v_calendar->>'accessRole')::TEXT,
    (v_calendar->>'defaultReminders')::JSONB,
    (v_calendar->>'notificationSettings')::JSONB,
    (v_calendar->>'primary')::BOOLEAN,
    (v_calendar->>'deleted')::BOOLEAN,
    (v_calendar->>'conferenceProperties')::JSONB,
    p_user_id
  ) ON CONFLICT (id) DO
UPDATE
SET google_calendar_id = EXCLUDED.google_calendar_id,
  etag = EXCLUDED.etag,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  time_zone = EXCLUDED.time_zone,
  summary_override = EXCLUDED.summary_override,
  color_id = EXCLUDED.color_id,
  background_color = EXCLUDED.background_color,
  foreground_color = EXCLUDED.foreground_color,
  hidden = EXCLUDED.hidden,
  selected = EXCLUDED.selected,
  access_role = EXCLUDED.access_role,
  default_reminders = EXCLUDED.default_reminders,
  notification_settings = EXCLUDED.notification_settings,
  is_primary = EXCLUDED.is_primary,
  deleted = EXCLUDED.deleted,
  conference_properties = EXCLUDED.conference_properties;
v_calendars_synced := v_calendars_synced + 1;
END LOOP;
-- Sync events
FOR v_event IN
SELECT *
FROM jsonb_array_elements(p_events) LOOP
INSERT INTO calendar_events (
    id,
    google_event_id,
    calendar_id,
    user_id summary,
    description,
    start_time,
    end_time,
    all_day,
    recurring_event_id,
    recurrence,
    location,
    creator,
    organizer,
    attendees,
    reminders,
    color_id,
    visibility,
    status,
    transparency,
    ical_uid,
    sequence,
    html_link,
    event_type,
    created,
    updated,
    original_start_time,
    attendees_omitted,
    extended_properties,
    hangout_link,
    conference_data,
    anyone_can_add_self,
    guests_can_invite_others,
    guests_can_modify,
    guests_can_see_other_guests,
    private_copy,
    etag,
    is_locked,
    source,
    attachments,
  )
VALUES (
    COALESCE((v_event->>'id')::TEXT, gen_random_uuid()::TEXT),
    (v_event->>'id')::TEXT,
    (v_event->>'calendarId')::TEXT,
    (v_event->>'etag')::TEXT,
    (v_event->>'status')::TEXT,
    (v_event->>'htmlLink')::TEXT,
    (v_event->>'created')::TIMESTAMP,
    (v_event->>'updated')::TIMESTAMP,
    (v_event->>'summary')::TEXT,
    (v_event->>'description')::TEXT,
    (v_event->>'location')::TEXT,
    (v_event->>'colorId')::TEXT,
    (v_event->>'creator')::JSONB,
    (v_event->>'organizer')::JSONB,
    COALESCE(
      (v_event->'start'->>'dateTime')::TIMESTAMP,
      (v_event->'start'->>'date')::TIMESTAMP
    ),
    COALESCE(
      (v_event->'end'->>'dateTime')::TIMESTAMP,
      (v_event->'end'->>'date')::TIMESTAMP
    ),
    (v_event->'start'->>'date') IS NOT NULL,
    (
      SELECT ARRAY(
          SELECT jsonb_array_elements_text(v_event->'recurrence')
        )
    ),
    (v_event->>'recurringEventId')::TEXT,
    (v_event->>'originalStartTime')::JSONB,
    (v_event->>'transparency')::TEXT,
    (v_event->>'visibility')::TEXT,
    (v_event->>'iCalUID')::TEXT,
    (v_event->>'sequence')::INT,
    (v_event->>'attendees')::JSONB,
    (v_event->>'attendeesOmitted')::BOOLEAN,
    (v_event->>'extendedProperties')::JSONB,
    (v_event->>'hangoutLink')::TEXT,
    (v_event->>'conferenceData')::JSONB,
    (v_event->>'anyoneCanAddSelf')::BOOLEAN,
    (v_event->>'guestsCanInviteOthers')::BOOLEAN,
    (v_event->>'guestsCanModify')::BOOLEAN,
    (v_event->>'guestsCanSeeOtherGuests')::BOOLEAN,
    (v_event->>'privateCopy')::BOOLEAN,
    (v_event->>'locked')::BOOLEAN,
    (v_event->>'reminders')::JSONB,
    (v_event->>'source')::JSONB,
    (v_event->>'attachments')::JSONB,
    (v_event->>'eventType')::TEXT,
    p_user_id
  ) ON CONFLICT (id) DO
UPDATE
SET google_event_id = EXCLUDED.google_event_id,
  calendar_id = EXCLUDED.calendar_id,
  etag = EXCLUDED.etag,
  status = EXCLUDED.status,
  html_link = EXCLUDED.html_link,
  created = EXCLUDED.created,
  updated = EXCLUDED.updated,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  color_id = EXCLUDED.color_id,
  creator = EXCLUDED.creator,
  organizer = EXCLUDED.organizer,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  all_day = EXCLUDED.all_day,
  recurrence = EXCLUDED.recurrence,
  recurring_event_id = EXCLUDED.recurring_event_id,
  original_start_time = EXCLUDED.original_start_time,
  transparency = EXCLUDED.transparency,
  visibility = EXCLUDED.visibility,
  ical_uid = EXCLUDED.ical_uid,
  sequence = EXCLUDED.sequence,
  attendees = EXCLUDED.attendees,
  attendees_omitted = EXCLUDED.attendees_omitted,
  extended_properties = EXCLUDED.extended_properties,
  hangout_link = EXCLUDED.hangout_link,
  conference_data = EXCLUDED.conference_data,
  anyone_can_add_self = EXCLUDED.anyone_can_add_self,
  guests_can_invite_others = EXCLUDED.guests_can_invite_others,
  guests_can_modify = EXCLUDED.guests_can_modify,
  guests_can_see_other_guests = EXCLUDED.guests_can_see_other_guests,
  private_copy = EXCLUDED.private_copy,
  is_locked = EXCLUDED.is_locked,
  reminders = EXCLUDED.reminders,
  source = EXCLUDED.source,
  attachments = EXCLUDED.attachments,
  event_type = EXCLUDED.event_type;
v_events_synced := v_events_synced + 1;
END LOOP;
RETURN jsonb_build_object(
  'calendars_synced',
  v_calendars_synced,
  'events_synced',
  v_events_synced
);
END;
$$;
ALTER FUNCTION "public"."sync_calendar"(
  "p_user_id" "uuid",
  "p_calendars" "jsonb",
  "p_events" "jsonb"
) OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger" LANGUAGE "plpgsql" AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.users (
    id,
    full_name,
    avatar_url,
    website,
    email,
    timezone
  )
VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'website',
    NEW.email,
    NEW.raw_user_meta_data->>'timezone'
  );
RETURN NEW;
END;
$$;
-- Create triggers
CREATE TRIGGER "goal_updated_at" BEFORE CREATE TRIGGER "on_auth_user_created"
AFTER
INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();
-- Set up RLS policies
ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."headers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."integrations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated user to view & modify their own data" ON "public"."goals" TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated user to view & modify their own data" ON "public"."headers" TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated user to view & modify their own data" ON "public"."projects" TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public users are viewable by everyone." ON "public"."users" FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own user." ON "public"."users" FOR
INSERT WITH CHECK ((auth.uid() = id));
CREATE POLICY "Users can update own user." ON "public"."users" FOR
UPDATE USING ((auth.uid() = id));
CREATE POLICY "Users can view their own integrations" ON "public"."integrations" FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own integrations" ON "public"."integrations" FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own integrations" ON "public"."integrations" FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own integrations" ON "public"."integrations" FOR DELETE USING (auth.uid() = user_id);
-- Add foreign key constraints
ALTER TABLE "public"."calendar_events"
ADD CONSTRAINT "calendar_event_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id"),
  ADD CONSTRAINT "calendar_event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."calendars"
ADD CONSTRAINT "calendar_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."integrations"
ADD CONSTRAINT "integration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."folder"
ADD CONSTRAINT "folder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE
SET NULL;
ALTER TABLE "public"."goals"
ADD CONSTRAINT "goal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "public"."headers"
ADD CONSTRAINT "header_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;
ALTER TABLE "public"."notes"
ADD CONSTRAINT "note_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id"),
  ADD CONSTRAINT "note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
ALTER TABLE "public"."projects"
ADD CONSTRAINT "project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;
ALTER TABLE "public"."tasks"
ADD CONSTRAINT "task_header_id_fkey" FOREIGN KEY ("header_id") REFERENCES "public"."headers"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
ALTER TABLE "public".""
ADD CONSTRAINT "shared_note_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "shared_note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."tag_tasks"
ADD CONSTRAINT "tag_task_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."tags"("id"),
  ADD CONSTRAINT "tag_task_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id"),
  ADD CONSTRAINT "tag_task_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id");
ALTER TABLE "public"."tags"
ADD CONSTRAINT "tag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
ALTER TABLE "public"."tasks"
ADD CONSTRAINT "task_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id"),
  ADD CONSTRAINT "task_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "public"."tasks"("id"),
  ADD CONSTRAINT "task_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "auth"."users"("id"),
  ADD CONSTRAINT "task_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id"),
  ADD CONSTRAINT "task_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id"),
  ADD CONSTRAINT "task_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");
-- Grant necessary permissions
GRANT USAGE ON SCHEMA "public" TO "postgres",
  "anon",
  "authenticated",
  "service_role";
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "postgres",
  "anon",
  "authenticated",
  "service_role";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "postgres",
  "anon",
  "authenticated",
  "service_role";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "postgres",
  "anon",
  "authenticated",
  "service_role";
-- Set default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "postgres",
  "anon",
  "authenticated",
  "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "postgres",
  "anon",
  "authenticated",
  "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "postgres",
  "anon",
  "authenticated",
  "service_role";
COMMENT ON SCHEMA "public" IS 'standard public schema';