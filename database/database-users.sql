USE todo_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
    );

-- Add user_id to todos table
ALTER TABLE todos ADD COLUMN user_id INT;
ALTER TABLE todos ADD CONSTRAINT fk_todo_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE todos ADD INDEX idx_user_id (user_id);

-- Create admin user (password: admin123)
-- Note: This is a BCrypt hash of "admin123"
INSERT INTO users (username, email, password, role) VALUES
    ('admin', 'admin@todo.com', '$2a$10$xZnNKYZ5cEHVX5Y5qJXmZOGKdZBqGJXlZvFqFqFqFqFqFqFqFqFqF', 'ADMIN');

-- Create regular user (password: user123)
INSERT INTO users (username, email, password, role) VALUES
    ('user', 'user@todo.com', '$2a$10$xZnNKYZ5cEHVX5Y5qJXmZOGKdZBqGJXlZvFqFqFqFqFqFqFqFqFqF', 'USER');
