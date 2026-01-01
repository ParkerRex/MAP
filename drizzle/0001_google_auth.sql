-- Migration: Add Google Sign-In support
-- This migration adds googleId column and removes password_hash

-- Step 1: Add google_id column as nullable (for existing users)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" text;--> statement-breakpoint

-- Step 2: Add unique constraint on google_id
-- Note: This allows null values (multiple users can have null google_id during migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_google_id_unique'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");
  END IF;
END $$;--> statement-breakpoint

-- Step 3: Drop password_hash column if it exists (no longer needed with Google-only auth)
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash";--> statement-breakpoint

-- Note: After this migration, users without google_id will need to sign in via Google.
-- The callback will link their existing account by email and set their google_id.
-- Once all users have google_id set, you can run:
-- ALTER TABLE "users" ALTER COLUMN "google_id" SET NOT NULL;
