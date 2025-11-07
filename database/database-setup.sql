CREATE DATABASE IF NOT EXISTS todo_db;
USE todo_db;

CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO todos (title, description, is_completed, due_date) VALUES todos
('Complete project setup', 'Set up Spring Boot and Node.js environment', FALSE, '2025-10-20 17:00:00'),
('Test CRUD operations', 'Verify all Create, Read, Update, Delete operations', FALSE, '2025-10-22 17:00:00'),
('Deploy application', 'Deploy to production server', FALSE, '2025-10-25 17:00:00');
