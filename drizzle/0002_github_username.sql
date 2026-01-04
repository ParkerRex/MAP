-- Migration: Add GitHub username to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_username" text;--> statement-breakpoint
