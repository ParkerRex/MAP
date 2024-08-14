-- Create the schema
CREATE SCHEMA calendar;
-- Accounts table
CREATE TABLE calendar.accounts (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  provider VARCHAR(50) NOT NULL
);
ALTER TABLE calendar.accounts OWNER TO postgres;
ALTER TABLE calendar.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own accounts" ON calendar.accounts FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Calendars table
CREATE TABLE calendar.calendars (
  id VARCHAR(255) PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES calendar.accounts(id),
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
ALTER TABLE calendar.calendars OWNER TO postgres;
ALTER TABLE calendar.calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendars" ON calendar.calendars FOR ALL USING (
  account_id IN (
    SELECT id
    FROM calendar.accounts
    WHERE id = auth.uid()
  )
) WITH CHECK (
  account_id IN (
    SELECT id
    FROM calendar.accounts
    WHERE id = auth.uid()
  )
);
-- Events table
CREATE TABLE calendar.events (
  id VARCHAR(255),
  calendar_id VARCHAR(255) REFERENCES calendar.calendars(id),
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
ALTER TABLE calendar.events OWNER TO postgres;
ALTER TABLE calendar.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own events" ON calendar.events FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
);
-- Event attendees
CREATE TABLE calendar.event_attendees (
  event_id VARCHAR(255),
  calendar_id VARCHAR(255),
  email VARCHAR(255),
  display_name VARCHAR(255),
  response_status VARCHAR(50),
  is_organizer BOOLEAN,
  is_self BOOLEAN,
  optional BOOLEAN,
  FOREIGN KEY (calendar_id, event_id) REFERENCES calendar.events(calendar_id, id),
  PRIMARY KEY (calendar_id, event_id, email)
);
ALTER TABLE calendar.event_attendees OWNER TO postgres;
ALTER TABLE calendar.event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own event attendees" ON calendar.event_attendees FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
);
-- Conference data for events
CREATE TABLE calendar.event_conferences (
  event_id VARCHAR(255),
  calendar_id VARCHAR(255),
  type VARCHAR(50),
  conference_id VARCHAR(255),
  name VARCHAR(255),
  url TEXT,
  FOREIGN KEY (calendar_id, event_id) REFERENCES calendar.events(calendar_id, id),
  PRIMARY KEY (calendar_id, event_id)
);
ALTER TABLE calendar.event_conferences OWNER TO postgres;
ALTER TABLE calendar.event_conferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own event conferences" ON calendar.event_conferences FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
);
-- Reminders for events
CREATE TABLE calendar.event_reminders (
  event_id VARCHAR(255),
  calendar_id VARCHAR(255),
  method VARCHAR(50),
  minutes INT,
  FOREIGN KEY (calendar_id, event_id) REFERENCES calendar.events(calendar_id, id),
  PRIMARY KEY (calendar_id, event_id, method, minutes)
);
ALTER TABLE calendar.event_reminders OWNER TO postgres;
ALTER TABLE calendar.event_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own event reminders" ON calendar.event_reminders FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
);
-- Color definitions
CREATE TABLE calendar.color_definitions (
  id VARCHAR(10),
  kind VARCHAR(50),
  background VARCHAR(7),
  foreground VARCHAR(7),
  PRIMARY KEY (id, kind)
);
ALTER TABLE calendar.color_definitions OWNER TO postgres;
ALTER TABLE calendar.color_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view color definitions" ON calendar.color_definitions FOR
SELECT USING (true);
-- Sync tokens for each calendar
CREATE TABLE calendar.sync_tokens (
  calendar_id VARCHAR(255) PRIMARY KEY REFERENCES calendar.calendars(id),
  sync_token TEXT NOT NULL
);
ALTER TABLE calendar.sync_tokens OWNER TO postgres;
ALTER TABLE calendar.sync_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own sync tokens" ON calendar.sync_tokens FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
);
-- Default reminders for calendars
CREATE TABLE calendar.calendar_default_reminders (
  calendar_id VARCHAR(255) REFERENCES calendar.calendars(id),
  method VARCHAR(50),
  minutes INT,
  PRIMARY KEY (calendar_id, method, minutes)
);
ALTER TABLE calendar.calendar_default_reminders OWNER TO postgres;
ALTER TABLE calendar.calendar_default_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendar default reminders" ON calendar.calendar_default_reminders FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
);
-- Conference properties for calendars
CREATE TABLE calendar.calendar_conference_properties (
  calendar_id VARCHAR(255) REFERENCES calendar.calendars(id),
  allowed_conference_solution_type VARCHAR(50),
  PRIMARY KEY (calendar_id, allowed_conference_solution_type)
);
ALTER TABLE calendar.calendar_conference_properties OWNER TO postgres;
ALTER TABLE calendar.calendar_conference_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendar conference properties" ON calendar.calendar_conference_properties FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
);
-- Notification settings for calendars
CREATE TABLE calendar.calendar_notification_settings (
  calendar_id VARCHAR(255) REFERENCES calendar.calendars(id),
  notification_type VARCHAR(50),
  method VARCHAR(50),
  PRIMARY KEY (calendar_id, notification_type, method)
);
ALTER TABLE calendar.calendar_notification_settings OWNER TO postgres;
ALTER TABLE calendar.calendar_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendar notification settings" ON calendar.calendar_notification_settings FOR ALL USING (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  calendar_id IN (
    SELECT id
    FROM calendar.calendars
    WHERE account_id IN (
        SELECT id
        FROM calendar.accounts
        WHERE id = auth.uid()
      )
  )
);