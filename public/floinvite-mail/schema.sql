/**
 * Floinvite Email Marketing Database Schema
 * Database: u958180753_mail
 * User: u958180753_mail
 * Created: 2025-12-29
 */

-- ═══════════════════════════════════════════════════
-- Subscribers Table
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS subscribers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  company VARCHAR(255),
  status ENUM('active', 'inactive', 'unsubscribed') DEFAULT 'active',
  unsubscribe_token VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (email),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════
-- Campaigns Table
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  preview_text VARCHAR(255),
  from_name VARCHAR(255) NOT NULL DEFAULT 'Floinvite',
  from_email VARCHAR(255) NOT NULL DEFAULT 'admin@floinvite.com',
  reply_to VARCHAR(255),
  html_body LONGTEXT NOT NULL,
  text_body LONGTEXT,
  status ENUM('draft', 'scheduled', 'sending', 'completed', 'paused', 'failed') DEFAULT 'draft',
  recipient_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  scheduled_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  INDEX idx_scheduled (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════
-- Campaign Sends Table (tracks each individual send)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_sends (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_id BIGINT NOT NULL,
  subscriber_id BIGINT NOT NULL,
  email VARCHAR(255) NOT NULL,
  tracking_id VARCHAR(32) NOT NULL UNIQUE,
  unsubscribe_token VARCHAR(64),
  status ENUM('pending', 'sent', 'failed', 'bounced', 'opened', 'clicked') DEFAULT 'pending',
  error_message VARCHAR(500),
  sent_at DATETIME,
  opened_at DATETIME,
  clicked_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE,
  INDEX idx_campaign (campaign_id),
  INDEX idx_subscriber (subscriber_id),
  INDEX idx_status (status),
  INDEX idx_tracking (tracking_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════
-- Send Queue Table (for batch processing)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS send_queue (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  send_id BIGINT NOT NULL,
  campaign_id BIGINT NOT NULL,
  email VARCHAR(255) NOT NULL,
  status ENUM('queued', 'processing', 'sent', 'failed') DEFAULT 'queued',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error_message VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (send_id) REFERENCES campaign_sends(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_campaign (campaign_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════
-- Email Opens Table (tracking pixels)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS email_opens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  send_id BIGINT NOT NULL,
  tracking_id VARCHAR(32) NOT NULL,
  opened_at DATETIME NOT NULL,
  user_agent VARCHAR(500),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (send_id) REFERENCES campaign_sends(id) ON DELETE CASCADE,
  INDEX idx_tracking (tracking_id),
  INDEX idx_opened (opened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════
-- Email Clicks Table (link tracking)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS email_clicks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  send_id BIGINT NOT NULL,
  tracking_id VARCHAR(32) NOT NULL,
  link_url VARCHAR(2048) NOT NULL,
  clicked_at DATETIME NOT NULL,
  user_agent VARCHAR(500),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (send_id) REFERENCES campaign_sends(id) ON DELETE CASCADE,
  INDEX idx_tracking (tracking_id),
  INDEX idx_clicked (clicked_at),
  INDEX idx_url (link_url(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════
-- Unsubscribe Log Table
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS unsubscribe_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subscriber_id BIGINT NOT NULL,
  campaign_id BIGINT,
  email VARCHAR(255) NOT NULL,
  unsubscribe_token VARCHAR(64),
  method ENUM('link', 'manual', 'bounce') DEFAULT 'link',
  unsubscribed_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  INDEX idx_subscriber (subscriber_id),
  INDEX idx_email (email),
  INDEX idx_date (unsubscribed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════
-- Rate Limit Log Table
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_id BIGINT NOT NULL,
  email_count INT DEFAULT 0,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hour_bucket INT COMMENT 'Hour of day (0-23)',
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign (campaign_id),
  INDEX idx_hour (sent_at, hour_bucket)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════
-- Admin Activity Log
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  admin_ip VARCHAR(45),
  action VARCHAR(100),
  campaign_id BIGINT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action (action),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════
-- Create initial admin user (optional)
-- ═══════════════════════════════════════════════════
-- Note: In production, use proper user management
-- This is just a placeholder for session-based auth

-- ═══════════════════════════════════════════════════
-- Indexes for common queries
-- ═══════════════════════════════════════════════════
CREATE INDEX idx_campaign_status_sent ON campaign_sends(campaign_id, status, sent_at);
CREATE INDEX idx_subscriber_status ON subscribers(status, created_at);
CREATE INDEX idx_campaign_timeline ON campaigns(created_at, status);
