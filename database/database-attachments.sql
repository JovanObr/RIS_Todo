

USE todo_db;
DROP TABLE IF EXISTS attachments;

-- Create attachments table
CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    todo_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL COMMENT 'File size in bytes',
    file_type VARCHAR(50) NOT NULL COMMENT 'MIME type (e.g., image/jpeg, application/pdf)',
    uploaded_by INT NOT NULL COMMENT 'User ID who uploaded the file',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_attachment_todo
        FOREIGN KEY (todo_id)
            REFERENCES todos(id)
            ON DELETE CASCADE,
    CONSTRAINT fk_attachment_user
        FOREIGN KEY (uploaded_by)
            REFERENCES users(id)
            ON DELETE CASCADE,
    INDEX idx_todo_id (todo_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DESCRIBE attachments;

SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = 'todo_db'
  AND TABLE_NAME = 'attachments'
  AND REFERENCED_TABLE_NAME IS NOT NULL;