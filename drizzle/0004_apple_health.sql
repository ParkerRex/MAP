-- Migration: Add Apple Health sync tables
CREATE TABLE IF NOT EXISTS "apple_health_connections" (
  "user_id" uuid PRIMARY KEY,
  "device_id" text,
  "device_name" text,
  "last_sync_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apple_health_data" (
  "user_id" uuid NOT NULL,
  "date" date NOT NULL,
  "steps" double precision,
  "active_energy" double precision,
  "basal_energy" double precision,
  "exercise_minutes" double precision,
  "stand_minutes" double precision,
  "distance_miles" double precision,
  "flights_climbed" double precision,
  "resting_heart_rate" double precision,
  "hrv_sdnn" double precision,
  "walking_heart_rate" double precision,
  "vo2_max" double precision,
  "oxygen_saturation" double precision,
  "respiratory_rate" double precision,
  "body_weight" double precision,
  "body_fat_percentage" double precision,
  "lean_body_mass" double precision,
  "sleep_hours" double precision,
  "sleep_awake_hours" double precision,
  "sleep_rem_hours" double precision,
  "sleep_core_hours" double precision,
  "sleep_deep_hours" double precision,
  "sleep_in_bed_hours" double precision,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone,
  CONSTRAINT "apple_health_data_pkey" PRIMARY KEY ("user_id", "date")
);
