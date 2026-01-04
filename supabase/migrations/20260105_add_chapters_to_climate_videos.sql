-- Add chapters column to climate_videos table for storing AI-generated chapters
ALTER TABLE climate_videos ADD COLUMN IF NOT EXISTS chapters JSONB;
