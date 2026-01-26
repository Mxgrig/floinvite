-- Add attachments column to campaigns table
-- This migration adds support for email attachments

ALTER TABLE campaigns ADD COLUMN attachments JSON DEFAULT NULL AFTER html_body;

-- Create index for faster queries
CREATE INDEX idx_attachments ON campaigns(id);

-- Migration Info: This allows campaigns to store file attachments as JSON metadata
-- Format: [{ "id": "att_xxx", "original_name": "file.pdf", "stored_name": "123_abc123.pdf", "file_type": "pdf", "file_size": 1024000, "mime_type": "application/pdf", "uploaded_at": "2025-01-26T..." }]
