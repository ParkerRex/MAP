-- Accounts table
CREATE TABLE public.calendar_accounts (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  provider VARCHAR(50) NOT NULL
);
ALTER TABLE public.calendar_accounts OWNER TO postgres;
ALTER TABLE public.calendar_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own accounts" ON public.calendar_accounts FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Calendars table
CREATE TABLE public.calendars (
  id VARCHAR(255) PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.calendar_accounts(id),
  provider VARCHAR(50) NOT NULL,
  kind VARCHAR(100),
  summary VARCHAR(255),
  description TEXT,
  time_zone VARCHAR(50),
  background_color VARCHAR(7),
  foreground_color VARCHAR(7),
  color_id VARCHAR(10),
  access_role VARCHAR(50),
  is_primary BOOLEAN,
  selected BOOLEAN,
  etag VARCHAR(255),
  subtitle VARCHAR(255),
  emoji VARCHAR(10),
  UNIQUE (account_id, id)
);
ALTER TABLE public.calendars OWNER TO postgres;
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendars" ON public.calendars FOR ALL USING (
  account_id IN (
    SELECT id
    FROM public.calendar_accounts
    WHERE id = auth.uid()
  )
) WITH CHECK (
  account_id IN (
    SELECT id
    FROM public.calendar_accounts
    WHERE id = auth.uid()
  )
);
-- Events table
CREATE TABLE public.calendar_events (
  id VARCHAR(255),
  calendar_id VARCHAR(255) REFERENCES public.calendars(id),
  summary VARCHAR(255),
  description TEXT,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  start_date DATE,
  end_date DATE,
  is_all_day BOOLEAN,
  recurrence TEXT [],
  -- Store recurrence rules as an array
  status VARCHAR(50),
  transparency VARCHAR(50),
  visibility VARCHAR(50),
  i_cal_uid VARCHAR(255),
  etag VARCHAR(255),
  created TIMESTAMP WITH TIME ZONE,
  updated TIMESTAMP WITH TIME ZONE,
  color_id VARCHAR(10),
  creator_email VARCHAR(255),
  organizer_email VARCHAR(255),
  sequence INT,
  guests_can_invite_others BOOLEAN,
  guests_can_modify BOOLEAN,
  guests_can_see_other_guests BOOLEAN,
  original_start_time TIMESTAMP WITH TIME ZONE,
  recurring_event_id VARCHAR(255),
  PRIMARY KEY (calendar_id, id)
);
ALTER TABLE public.calendar_events OWNER TO postgres;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own events" ON public.calendar_events FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
);
-- Event attendees
CREATE TABLE public.calendar_event_attendees (
  event_id VARCHAR(255),
  calendar_id VARCHAR(255),
  email VARCHAR(255),
  display_name VARCHAR(255),
  response_status VARCHAR(50),
  is_organizer BOOLEAN,
  is_self BOOLEAN,
  optional BOOLEAN,
  FOREIGN KEY (calendar_id, event_id) REFERENCES public.calendar_events(calendar_id, id),
  PRIMARY KEY (calendar_id, event_id, email)
);
ALTER TABLE public.calendar_event_attendees OWNER TO postgres;
ALTER TABLE public.calendar_event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own event attendees" ON public.calendar_event_attendees FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
);
-- Conference data for events
CREATE TABLE public.calendar_event_conferences (
  event_id VARCHAR(255),
  calendar_id VARCHAR(255),
  type VARCHAR(50),
  conference_id VARCHAR(255),
  name VARCHAR(255),
  url TEXT,
  FOREIGN KEY (calendar_id, event_id) REFERENCES public.calendar_events(calendar_id, id),
  PRIMARY KEY (calendar_id, event_id)
);
ALTER TABLE public.calendar_event_conferences OWNER TO postgres;
ALTER TABLE public.calendar_event_conferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own event conferences" ON public.calendar_event_conferences FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
);
-- Reminders for events
CREATE TABLE public.calendar_event_reminders (
  event_id VARCHAR(255),
  calendar_id VARCHAR(255),
  method VARCHAR(50),
  minutes INT,
  FOREIGN KEY (calendar_id, event_id) REFERENCES public.calendar_events(calendar_id, id),
  PRIMARY KEY (calendar_id, event_id, method, minutes)
);
ALTER TABLE public.calendar_event_reminders OWNER TO postgres;
ALTER TABLE public.calendar_event_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own event reminders" ON public.calendar_event_reminders FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
);
-- Color definitions
CREATE TABLE public.calendar_color_definitions (
  id VARCHAR(10),
  kind VARCHAR(50),
  background VARCHAR(7),
  foreground VARCHAR(7),
  PRIMARY KEY (id, kind)
);
ALTER TABLE public.calendar_color_definitions OWNER TO postgres;
ALTER TABLE public.calendar_color_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view color definitions" ON public.calendar_color_definitions FOR
SELECT USING (true);
-- Sync tokens for each calendar
CREATE TABLE public.calendar_sync_tokens (
  calendar_id VARCHAR(255) PRIMARY KEY REFERENCES public.calendars(id),
  sync_token TEXT NOT NULL
);
ALTER TABLE public.calendar_sync_tokens OWNER TO postgres;
ALTER TABLE public.calendar_sync_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own sync tokens" ON public.calendar_sync_tokens FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
);
-- Default reminders for calendars
CREATE TABLE public.calendar_default_reminders (
  calendar_id VARCHAR(255) REFERENCES public.calendars(id),
  method VARCHAR(50),
  minutes INT,
  PRIMARY KEY (calendar_id, method, minutes)
);
ALTER TABLE public.calendar_default_reminders OWNER TO postgres;
ALTER TABLE public.calendar_default_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendar default reminders" ON public.calendar_default_reminders FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
);
-- Conference properties for calendars
CREATE TABLE public.calendar_conference_properties (
  calendar_id VARCHAR(255) REFERENCES public.calendars(id),
  allowed_conference_solution_type VARCHAR(50),
  PRIMARY KEY (calendar_id, allowed_conference_solution_type)
);
ALTER TABLE public.calendar_conference_properties OWNER TO postgres;
ALTER TABLE public.calendar_conference_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendar conference properties" ON public.calendar_conference_properties FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
);
-- Notification settings for calendars
CREATE TABLE public.calendar_notification_settings (
  calendar_id VARCHAR(255) REFERENCES public.calendars(id),
  notification_type VARCHAR(50),
  method VARCHAR(50),
  PRIMARY KEY (calendar_id, notification_type, method)
);
ALTER TABLE public.calendar_notification_settings OWNER TO postgres;
ALTER TABLE public.calendar_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendar notification settings" ON public.calendar_notification_settings FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM public.calendars
    WHERE account_id IN (
        SELECT id
        FROM public.calendar_accounts
        WHERE id = auth.uid()
      )
  )
);