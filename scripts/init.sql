-- Map AI Local Development Database Schema
-- This script initializes the database with all required tables and a dev user

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE goal_categories AS ENUM ('health', 'work', 'personal', 'family', 'spiritual');
CREATE TYPE goal_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE integration_provider AS ENUM ('WHOOP', 'GOOGLE');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  display_name TEXT,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  locale TEXT,
  profile_photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);

-- Folders table
CREATE TABLE folder (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  title TEXT,
  content TEXT,
  folder_id UUID NOT NULL REFERENCES folder(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  name TEXT,
  description TEXT,
  project_position INTEGER,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Headers table
CREATE TABLE headers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  task_status task_status DEFAULT 'pending',
  task_position INTEGER,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  completed_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  header_id UUID REFERENCES headers(id) ON DELETE SET NULL,
  blocked_by UUID REFERENCES tasks(id) ON DELETE SET NULL,
  contact_id UUID,
  result TEXT,
  scheduled_for TIMESTAMPTZ,
  actual_duration INTERVAL,
  estimated_duration INTERVAL
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Tag-Task junction table
CREATE TABLE tag_tasks (
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tags(id) ON DELETE SET NULL,
  PRIMARY KEY (tag_id, task_id)
);

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ NOT NULL,
  title TEXT,
  completed BOOLEAN DEFAULT FALSE,
  goal_category goal_categories DEFAULT 'personal',
  goal_status goal_status DEFAULT 'pending',
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Integrations table
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  provider integration_provider NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Calendar accounts table
CREATE TABLE calendar_accounts (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email TEXT NOT NULL,
  provider TEXT NOT NULL
);

-- Calendars table
CREATE TABLE calendars (
  id TEXT PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES calendar_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  time_zone TEXT,
  background_color TEXT,
  foreground_color TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  selected BOOLEAN DEFAULT TRUE,
  access_role TEXT,
  color_id TEXT,
  emoji TEXT,
  etag TEXT,
  kind TEXT,
  subtitle TEXT
);

-- Calendar events table
CREATE TABLE calendar_events (
  id TEXT NOT NULL,
  calendar_id TEXT NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  summary TEXT,
  description TEXT,
  start_time TEXT,
  start_date TEXT,
  end_time TEXT,
  end_date TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  status TEXT,
  recurrence TEXT[],
  recurring_event_id TEXT,
  color_id TEXT,
  created TEXT,
  updated TEXT,
  creator_email TEXT,
  organizer_email TEXT,
  i_cal_uid TEXT,
  etag TEXT,
  sequence INTEGER,
  visibility TEXT,
  transparency TEXT,
  guests_can_invite_others BOOLEAN,
  guests_can_modify BOOLEAN,
  guests_can_see_other_guests BOOLEAN,
  original_start_time TEXT,
  contact_id UUID,
  PRIMARY KEY (id, calendar_id)
);

-- Calendar event attendees
CREATE TABLE calendar_event_attendees (
  calendar_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  is_organizer BOOLEAN,
  is_self BOOLEAN,
  optional BOOLEAN,
  response_status TEXT,
  contact_id UUID,
  PRIMARY KEY (calendar_id, event_id, email),
  FOREIGN KEY (calendar_id, event_id) REFERENCES calendar_events(calendar_id, id) ON DELETE CASCADE
);

-- Calendar sync tokens
CREATE TABLE calendar_sync_tokens (
  calendar_id TEXT PRIMARY KEY REFERENCES calendars(id) ON DELETE CASCADE,
  sync_token TEXT NOT NULL
);

-- Contacts table (for calendar attendees)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES calendar_accounts(id) ON DELETE CASCADE,
  resource_name TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  photo_url TEXT,
  etag TEXT,
  type TEXT
);

-- Preferences table
CREATE TABLE preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  primary_time_zone TEXT,
  preferred_locale TEXT,
  show_week_numbers BOOLEAN,
  dismissed_welcome_dialog BOOLEAN,
  dismissed_welcome_checklist BOOLEAN,
  dismissed_referral_card BOOLEAN,
  shown_welcome_dialog BOOLEAN,
  auto_add_conferencing_prompt_viewed BOOLEAN,
  auto_change_time_zones_prompt_enabled BOOLEAN
);

-- Sync logs table
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT
);

-- Indexes for performance
CREATE INDEX idx_folder_user_id ON folder(user_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_calendar_events_calendar_id ON calendar_events(calendar_id);

-- ============================================
-- SEED DATA
-- ============================================

-- Dev user (ID matches DEV_USER constant)
INSERT INTO users (id, email, display_name, first_name, last_name, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@localhost',
  'Dev User',
  'Dev',
  'User',
  'active'
);

-- Default folder for notes
INSERT INTO folder (id, name, user_id)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'General',
  '00000000-0000-0000-0000-000000000001'
);

-- Sample note
INSERT INTO notes (id, title, content, folder_id, user_id)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Welcome to Map',
  'This is your first note. Start writing!',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001'
);

-- Preferences for dev user
INSERT INTO preferences (user_id, primary_time_zone, show_week_numbers)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'America/Los_Angeles',
  false
);

-- Sample project
INSERT INTO projects (id, name, description, user_id, project_position)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Personal',
  'Personal tasks and todos',
  '00000000-0000-0000-0000-000000000001',
  0
);

-- Sample tags
INSERT INTO tags (id, title, user_id) VALUES
  ('00000000-0000-0000-0000-000000000005', 'work', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000006', 'personal', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000007', 'urgent', '00000000-0000-0000-0000-000000000001');

-- Sample task
INSERT INTO tasks (id, title, body, created_by, updated_by, task_status, project_id)
VALUES (
  '00000000-0000-0000-0000-000000000008',
  'Set up local development',
  'Get the dashboard running with Docker',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'in_progress',
  '00000000-0000-0000-0000-000000000004'
);

RAISE NOTICE 'Database initialized successfully with dev user and sample data!';
