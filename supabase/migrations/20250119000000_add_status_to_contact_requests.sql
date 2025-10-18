-- Add status column to contact_requests table

ALTER TABLE contact_requests
ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';