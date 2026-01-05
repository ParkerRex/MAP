-- Migration: Add GitHub integration provider
ALTER TYPE "integration_provider" ADD VALUE IF NOT EXISTS 'GITHUB';--> statement-breakpoint
