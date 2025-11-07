USE todo_db;

-- Create Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    todo_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    INDEX idx_todo_id (todo_id)
);

-- Sample data (optional)
INSERT INTO subtasks (todo_id, title, is_completed, position) VALUES
(8, 'Research project requirements', TRUE, 0),
(8, 'Create initial design mockups', TRUE, 1),
(8, 'Set up development environment', FALSE, 2),
(8, 'Write initial code', FALSE, 3);