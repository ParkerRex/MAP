CREATE TYPE "public"."goal_categories" AS ENUM('health', 'work', 'personal', 'family', 'spiritual');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('GOOGLE', 'WHOOP');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."whoop_score_state" AS ENUM('SCORED', 'PENDING_SCORE', 'UNSCORABLE');--> statement-breakpoint
CREATE TABLE "calendar_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"provider" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_event_attendees" (
	"calendar_id" text NOT NULL,
	"event_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"response_status" text,
	"is_organizer" boolean,
	"is_self" boolean,
	"optional" boolean,
	"contact_id" uuid,
	CONSTRAINT "calendar_event_attendees_calendar_id_event_id_email_pk" PRIMARY KEY("calendar_id","event_id","email")
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" text NOT NULL,
	"calendar_id" text NOT NULL,
	"summary" text,
	"description" text,
	"location" text,
	"start_time" text,
	"end_time" text,
	"start_date" text,
	"end_date" text,
	"is_all_day" boolean,
	"color_id" text,
	"status" text,
	"creator_email" text,
	"organizer_email" text,
	"etag" text,
	"i_cal_uid" text,
	"visibility" text,
	"transparency" text,
	"sequence" integer,
	"recurring_event_id" text,
	"original_start_time" text,
	"recurrence" text[],
	"guests_can_invite_others" boolean,
	"guests_can_modify" boolean,
	"guests_can_see_other_guests" boolean,
	"contact_id" text,
	"created" text,
	"updated" text,
	CONSTRAINT "calendar_events_id_calendar_id_pk" PRIMARY KEY("id","calendar_id")
);
--> statement-breakpoint
CREATE TABLE "calendar_sync_tokens" (
	"calendar_id" text PRIMARY KEY NOT NULL,
	"sync_token" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendars" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"summary" text,
	"description" text,
	"background_color" text,
	"foreground_color" text,
	"color_id" text,
	"selected" boolean DEFAULT true,
	"is_primary" boolean DEFAULT false,
	"access_role" text,
	"time_zone" text,
	"etag" text,
	"kind" text,
	"emoji" text,
	"subtitle" text
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"resource_name" text NOT NULL,
	"display_name" text,
	"email" text,
	"photo_url" text,
	"etag" text,
	"type" text
);
--> statement-breakpoint
CREATE TABLE "folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"completed" boolean DEFAULT false,
	"due_at" timestamp with time zone NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_category" "goal_categories" DEFAULT 'personal',
	"goal_status" "goal_status" DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "headers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"content" text,
	"folder_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"primary_time_zone" text,
	"preferred_locale" text,
	"show_week_numbers" boolean,
	"dismissed_welcome_dialog" boolean,
	"dismissed_welcome_checklist" boolean,
	"dismissed_referral_card" boolean,
	"shown_welcome_dialog" boolean,
	"auto_add_conferencing_prompt_viewed" boolean,
	"auto_change_time_zones_prompt_enabled" boolean
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"description" text,
	"project_position" integer,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"status" text NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tag_tasks" (
	"tag_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"parent_id" uuid,
	CONSTRAINT "tag_tasks_tag_id_task_id_pk" PRIMARY KEY("tag_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"task_status" "task_status" DEFAULT 'pending',
	"task_position" integer,
	"header_id" uuid,
	"project_id" uuid,
	"assigned_to" uuid,
	"blocked_by" uuid,
	"contact_id" uuid,
	"scheduled_for" timestamp with time zone,
	"result" text,
	"actual_duration" interval,
	"estimated_duration" interval
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"display_name" text,
	"first_name" text,
	"last_name" text,
	"locale" text,
	"profile_photo_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "whoop_cycles" (
	"id" text PRIMARY KEY NOT NULL,
	"odata_id" text,
	"user_id" uuid NOT NULL,
	"whoop_user_id" text NOT NULL,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone,
	"timezone_offset" text,
	"score_state" "whoop_score_state" NOT NULL,
	"strain" text,
	"kilojoule" text,
	"average_heart_rate" integer,
	"max_heart_rate" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "whoop_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"whoop_user_id" text NOT NULL,
	"email" text,
	"first_name" text,
	"last_name" text,
	"height_meter" text,
	"weight_kilogram" text,
	"max_heart_rate" integer,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "whoop_recovery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" text NOT NULL,
	"sleep_id" text,
	"user_id" uuid NOT NULL,
	"whoop_user_id" text NOT NULL,
	"score_state" "whoop_score_state" NOT NULL,
	"recovery_score" integer,
	"resting_heart_rate" text,
	"hrv_rmssd" text,
	"spo2_percentage" text,
	"skin_temp_celsius" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "whoop_sleep" (
	"id" text PRIMARY KEY NOT NULL,
	"odata_id" text,
	"cycle_id" text,
	"user_id" uuid NOT NULL,
	"whoop_user_id" text NOT NULL,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone,
	"timezone_offset" text,
	"is_nap" boolean DEFAULT false,
	"score_state" "whoop_score_state" NOT NULL,
	"total_in_bed_time" integer,
	"total_awake_time" integer,
	"total_no_data_time" integer,
	"total_light_sleep_time" integer,
	"total_slow_wave_sleep_time" integer,
	"total_rem_sleep_time" integer,
	"sleep_cycle_count" integer,
	"disturbance_count" integer,
	"sleep_needed" integer,
	"respiratory_rate" text,
	"sleep_performance_percentage" text,
	"sleep_consistency_percentage" text,
	"sleep_efficiency_percentage" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "whoop_workouts" (
	"id" text PRIMARY KEY NOT NULL,
	"odata_id" text,
	"user_id" uuid NOT NULL,
	"whoop_user_id" text NOT NULL,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone,
	"timezone_offset" text,
	"sport_id" integer,
	"sport_name" text,
	"score_state" "whoop_score_state" NOT NULL,
	"strain" text,
	"average_heart_rate" integer,
	"max_heart_rate" integer,
	"kilojoule" text,
	"distance_meters" text,
	"altitude_gain_meters" text,
	"altitude_loss_meters" text,
	"zone_zero_ms" integer,
	"zone_one_ms" integer,
	"zone_two_ms" integer,
	"zone_three_ms" integer,
	"zone_four_ms" integer,
	"zone_five_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whoop_recovery" ADD CONSTRAINT "whoop_recovery_cycle_id_whoop_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."whoop_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whoop_sleep" ADD CONSTRAINT "whoop_sleep_cycle_id_whoop_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."whoop_cycles"("id") ON DELETE set null ON UPDATE no action;