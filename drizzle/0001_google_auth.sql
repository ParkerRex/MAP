-- Migration: Add Google Sign-In support
-- This migration adds googleId column and removes password_hash

-- Add google_id column (nullable initially for existing users)
ALTER TABLE "users" ADD COLUMN "google_id" text;--> statement-breakpoint

-- Add unique constraint on google_id
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");--> statement-breakpoint

-- Drop password_hash column (no longer needed with Google-only auth)
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash";
