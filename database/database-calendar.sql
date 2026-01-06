USE todo_db;

-- Store Google OAuth tokens per user
CREATE TABLE google_calendar_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP NOT NULL,
    calendar_id VARCHAR(255),
    is_sync_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_calendar_token_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add Google Calendar event ID to todos table
ALTER TABLE todos ADD COLUMN google_calendar_event_id VARCHAR(255);
ALTER TABLE todos ADD INDEX idx_calendar_event (google_calendar_event_id);