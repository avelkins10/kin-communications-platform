-- Enable pg_trgm extension for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for voicemail search
-- Note: These indexes will be created without CONCURRENTLY to work within Prisma transactions
CREATE INDEX IF NOT EXISTS "Voicemail_transcription_trgm_idx" ON "Voicemail" USING gin("transcription" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Voicemail_notes_trgm_idx" ON "Voicemail" USING gin("notes" gin_trgm_ops);