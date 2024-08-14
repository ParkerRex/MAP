SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
CREATE SCHEMA IF NOT EXISTS "public";
CREATE SCHEMA IF NOT EXISTS "users";
CREATE SCHEMA IF NOT EXISTS "private";
ALTER SCHEMA "private" OWNER TO "postgres";
COMMENT ON SCHEMA "public" IS 'standard public schema';
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";
-- Create custom types
CREATE TYPE "public"."integration_provider" AS ENUM ('WHOOP', 'GOOGLE');
ALTER TYPE "public"."integration_provider" OWNER TO "postgres";
CREATE TYPE "public"."source" AS ENUM ('agent', 'user');
ALTER TYPE "public"."source" OWNER TO "postgres";
CREATE TYPE "public"."task_status" AS ENUM ('pending', 'in_progress', 'completed');
ALTER TYPE "public"."task_status" OWNER TO "postgres";
CREATE TYPE "public"."goal_status" AS ENUM ('pending', 'in_progress', 'completed');
ALTER TYPE "public"."goal_status" OWNER TO "postgres";
CREATE TYPE "public"."goal_categories" AS ENUM (
  'health',
  'work',
  'personal',
  'family',
  'spiritual'
);
ALTER TYPE "public"."goal_categories" OWNER TO "postgres";
-- Create tables
-- Users table
CREATE TABLE "users"."users" (
  "id" UUID PRIMARY KEY,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  locale VARCHAR(10),
  profile_photo_url TEXT
);
ALTER TABLE "users"."users" OWNER TO "postgres";
ALTER TABLE ONLY "users"."users"
ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
-- Accounts table
CREATE TABLE users.accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_primary BOOLEAN NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_photo_url TEXT,
  provider_name VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  hosted_domain VARCHAR(255),
  UNIQUE (provider_name, provider_user_id)
);
ALTER TABLE "users"."accounts" OWNER TO "postgres";
-- Account scopes table
CREATE TABLE users.account_scopes (
  account_id UUID REFERENCES users.accounts(id),
  scope TEXT NOT NULL,
  PRIMARY KEY (account_id, scope)
);
ALTER TABLE "users"."account_scopes" OWNER TO "postgres";
-- Account info table (for additional provider-specific information)
CREATE TABLE users.account_info (
  account_id UUID PRIMARY KEY REFERENCES users.accounts(id),
  info JSONB NOT NULL
);
ALTER TABLE "users"."account_info" OWNER TO "postgres";
-- Access tokens table (if you want to store them, consider security implications)
CREATE TABLE users.access_tokens (
  user_id UUID PRIMARY KEY REFERENCES users.users(id),
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
ALTER TABLE "users"."access_tokens" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."folder" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."folder" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."goals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID DEFAULT auth.uid() NOT NULL,
  "goal_category" public.goal_categories DEFAULT 'personal'::public.goal_categories NOT NULL,
  "goal_status" public.goal_status DEFAULT 'pending'::public.goal_status NOT NULL,
  "title" TEXT,
  "completed" BOOLEAN DEFAULT false,
  "due_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT "goals_due_date_check" CHECK (due_at > now())
);
ALTER TABLE "public"."goals" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."headers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "user_id" UUID DEFAULT auth.uid() NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);
ALTER TABLE "public"."headers" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "users"."integrations" (
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
ALTER TABLE "users"."integrations" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."notes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR,
  "content" TEXT,
  "user_id" UUID NOT NULL,
  "folder_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE "public"."notes" OWNER TO "postgres";
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
ALTER TABLE "public"."projects" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."tags" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL UNIQUE,
  "user_id" UUID DEFAULT auth.uid()
);
ALTER TABLE "public"."tags" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."tag_tasks" (
  "tag_id" UUID NOT NULL,
  "task_id" UUID NOT NULL,
  "parent_id" UUID,
  PRIMARY KEY (tag_id, task_id),
  UNIQUE (tag_id, task_id)
);
ALTER TABLE "public"."tag_tasks" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "body" TEXT,
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
  "task_status" public.task_status DEFAULT 'pending'::public.task_status NOT NULL,
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
ALTER TABLE "public"."tasks" OWNER TO "postgres";
-- Create functions
CREATE OR REPLACE FUNCTION "users"."handle_new_user"() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO users.users (
    id,
    created_at,
    status,
    email,
    username,
    display_name,
    first_name,
    last_name,
    locale,
    profile_photo_url
  )
VALUES (
    NEW.id,
    NEW.created_at,
    'active',
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'locale',
    NEW.raw_user_meta_data->>'avatar_url'
  );
RETURN NEW;
END;
$$;
ALTER FUNCTION "users"."handle_new_user"() OWNER TO "postgres";
-- Create triggers
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION users.handle_new_user();
-- Set up RLS policies
ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."headers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users"."integrations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated user to view & modify their own data" ON "public"."goals" TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated user to view & modify their own data" ON "public"."headers" TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated user to view & modify their own data" ON "public"."projects" TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can select their own profile." ON "users"."users" FOR
SELECT USING (("auth"."uid"() = "id"));
CREATE POLICY "Users can insert their own profile." ON "users"."users" FOR
INSERT WITH CHECK (("auth"."uid"() = "id"));
CREATE POLICY "Users can update own profile." ON "users"."users" FOR
UPDATE USING (("auth"."uid"() = "id"));
CREATE POLICY "Users can view their own integrations" ON "users"."integrations" FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own integrations" ON "users"."integrations" FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own integrations" ON "users"."integrations" FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own integrations" ON "users"."integrations" FOR DELETE USING (auth.uid() = user_id);
-- Add foreign key constraints
ALTER TABLE "users"."integrations"
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
GRANT ALL ON TABLE "users"."users" TO "anon";
GRANT ALL ON TABLE "users"."users" TO "authenticated";
GRANT ALL ON TABLE "users"."users" TO "service_role";
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
GRANT ALL ON FUNCTION "users"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "users"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "users"."handle_new_user"() TO "service_role";