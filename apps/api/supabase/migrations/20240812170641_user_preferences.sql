-- Device Types
CREATE TABLE users.device_types (
  user_id UUID PRIMARY KEY REFERENCES users.users(id),
  data JSONB NOT NULL
);
ALTER TABLE users.device_types OWNER TO postgres;
ALTER TABLE users.device_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own device types" ON users.device_types FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Recent Places
CREATE TABLE users.recent_places (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users.users(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  google_place_id VARCHAR(255),
  formatted_address TEXT,
  UNIQUE (user_id, google_place_id)
);
ALTER TABLE users.recent_places OWNER TO postgres;
ALTER TABLE users.recent_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own recent places" ON users.recent_places FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Time Zone Labels
CREATE TABLE users.time_zone_labels (
  user_id UUID REFERENCES users.users(id),
  time_zone VARCHAR(50),
  label VARCHAR(255),
  PRIMARY KEY (user_id, time_zone)
);
ALTER TABLE users.time_zone_labels OWNER TO postgres;
ALTER TABLE users.time_zone_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own time zone labels" ON users.time_zone_labels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Recent Time Zones
CREATE TABLE users.recent_time_zones (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users.users(id),
  time_zone_id VARCHAR(50) NOT NULL,
  UNIQUE (user_id, time_zone_id)
);
ALTER TABLE users.recent_time_zones OWNER TO postgres;
ALTER TABLE users.recent_time_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own recent time zones" ON users.recent_time_zones FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Calendar List State
CREATE TABLE users.calendar_list_state (
  user_id UUID PRIMARY KEY REFERENCES users.users(id),
  data JSONB NOT NULL
);
ALTER TABLE users.calendar_list_state OWNER TO postgres;
ALTER TABLE users.calendar_list_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendar list state" ON users.calendar_list_state FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Recent Participants
CREATE TABLE users.recent_participants (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users.users(id),
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  UNIQUE (user_id, email)
);
ALTER TABLE users.recent_participants OWNER TO postgres;
ALTER TABLE users.recent_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own recent participants" ON users.recent_participants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- User Preferences
CREATE TABLE users.preferences (
  user_id UUID PRIMARY KEY REFERENCES users.users(id),
  preferred_locale VARCHAR(10),
  primary_time_zone VARCHAR(50),
  show_week_numbers BOOLEAN,
  shown_welcome_dialog BOOLEAN,
  dismissed_referral_card BOOLEAN,
  dismissed_welcome_dialog BOOLEAN,
  dismissed_welcome_checklist BOOLEAN,
  auto_add_conferencing_prompt_viewed BOOLEAN,
  auto_change_time_zones_prompt_enabled BOOLEAN
);
ALTER TABLE users.preferences OWNER TO postgres;
ALTER TABLE users.preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own preferences" ON users.preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Default Conferencing
CREATE TABLE users.default_conferencing (
  user_id UUID PRIMARY KEY REFERENCES users.users(id),
  provider_name VARCHAR(50) NOT NULL
);
ALTER TABLE users.default_conferencing OWNER TO postgres;
ALTER TABLE users.default_conferencing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own default conferencing" ON users.default_conferencing FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Upcoming Meeting Menu Bar Tray
CREATE TABLE users.upcoming_meeting_menu_bar_tray (
  user_id UUID PRIMARY KEY REFERENCES users.users(id),
  include_all_day_events BOOLEAN NOT NULL
);
ALTER TABLE users.upcoming_meeting_menu_bar_tray OWNER TO postgres;
ALTER TABLE users.upcoming_meeting_menu_bar_tray ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own upcoming meeting menu bar tray" ON users.upcoming_meeting_menu_bar_tray FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Completed Welcome Checklist IDs
CREATE TABLE users.completed_welcome_checklist_ids (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users.users(id),
  checklist_id VARCHAR(255) NOT NULL,
  UNIQUE (user_id, checklist_id)
);
ALTER TABLE users.completed_welcome_checklist_ids OWNER TO postgres;
ALTER TABLE users.completed_welcome_checklist_ids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own completed welcome checklist IDs" ON users.completed_welcome_checklist_ids FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Device Type Details
CREATE TABLE users.device_type_details (
  user_id UUID REFERENCES users.users(id),
  device_type VARCHAR(50),
  days_per_period INTEGER,
  interface_theme VARCHAR(50),
  show_week_numbers BOOLEAN,
  density_zoom_level FLOAT,
  show_declined_events BOOLEAN,
  max_visible_time_zones INTEGER,
  PRIMARY KEY (user_id, device_type)
);
ALTER TABLE users.device_type_details OWNER TO postgres;
ALTER TABLE users.device_type_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own device type details" ON users.device_type_details FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Device Type Widget Settings
CREATE TABLE users.device_type_widget_settings (
  user_id UUID REFERENCES users.users(id),
  device_type VARCHAR(50),
  days_from_now_threshold INTEGER,
  home_screen_include_all_day BOOLEAN,
  lock_screen_include_all_day BOOLEAN,
  lock_screen_event_title_hidden BOOLEAN,
  upcoming_hours_from_now_threshold INTEGER,
  PRIMARY KEY (user_id, device_type),
  FOREIGN KEY (user_id, device_type) REFERENCES users.device_type_details(user_id, device_type)
);
ALTER TABLE users.device_type_widget_settings OWNER TO postgres;
ALTER TABLE users.device_type_widget_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own device type widget settings" ON users.device_type_widget_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Calendar List State Accounts
CREATE TABLE users.calendar_list_state_accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users.users(id),
  account_id UUID NOT NULL,
  UNIQUE (user_id, account_id)
);
ALTER TABLE users.calendar_list_state_accounts OWNER TO postgres;
ALTER TABLE users.calendar_list_state_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendar list state accounts" ON users.calendar_list_state_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Calendar List State Calendars
CREATE TABLE users.calendar_list_state_calendars (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES users.calendar_list_state_accounts(id),
  calendar_id VARCHAR(255) NOT NULL,
  active BOOLEAN,
  selected BOOLEAN,
  UNIQUE (account_id, calendar_id)
);
ALTER TABLE users.calendar_list_state_calendars OWNER TO postgres;
ALTER TABLE users.calendar_list_state_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own calendar list state calendars" ON users.calendar_list_state_calendars FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM users.calendar_list_state_accounts
    WHERE users.calendar_list_state_accounts.id = users.calendar_list_state_calendars.account_id
      AND users.calendar_list_state_accounts.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users.calendar_list_state_accounts
    WHERE users.calendar_list_state_accounts.id = users.calendar_list_state_calendars.account_id
      AND users.calendar_list_state_accounts.user_id = auth.uid()
  )
);