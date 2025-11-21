package com.todo.controller;

import com.todo.entity.Todo;
import com.todo.repository.TodoRepository;
import com.todo.repository.SubtaskRepository;
import com.todo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private SubtaskRepository subtaskRepository;

    @Autowired
    private UserService userService;

    // Get all todos from all users
    @GetMapping("/todos")
    public ResponseEntity<List<Todo>> getAllTodos() {
        List<Todo> todos = todoRepository.findAll();
        return ResponseEntity.ok(todos);
    }

    // Get todos by user ID
    @GetMapping("/todos/user/{userId}")
    public ResponseEntity<List<Todo>> getTodosByUserId(@PathVariable Integer userId) {
        List<Todo> todos = todoRepository.findAll().stream()
                .filter(todo -> todo.getUser() != null && todo.getUser().getId().equals(userId))
                .toList();
        return ResponseEntity.ok(todos);
    }

    // Get application statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAppStats() {
        Map<String, Object> stats = new HashMap<>();

        // User statistics
        stats.put("totalUsers", userService.getTotalUsers());
        stats.put("regularUsers", userService.getRegularUsersCount());
        stats.put("adminUsers", userService.getAdminUsersCount());

        // Todo statistics
        long totalTodos = todoRepository.count();
        long completedTodos = todoRepository.findAll().stream()
                .filter(Todo::getIsCompleted)
                .count();
        long pendingTodos = totalTodos - completedTodos;

        stats.put("totalTodos", totalTodos);
        stats.put("completedTodos", completedTodos);
        stats.put("pendingTodos", pendingTodos);
        stats.put("completionRate", totalTodos > 0 ? (completedTodos * 100.0 / totalTodos) : 0);

        // Subtask statistics
        long totalSubtasks = subtaskRepository.count();
        long completedSubtasks = subtaskRepository.findAll().stream()
                .filter(subtask -> subtask.getIsCompleted())
                .count();

        stats.put("totalSubtasks", totalSubtasks);
        stats.put("completedSubtasks", completedSubtasks);
        stats.put("pendingSubtasks", totalSubtasks - completedSubtasks);

        // Average todos per user
        long totalUsersCount = userService.getTotalUsers();
        stats.put("avgTodosPerUser", totalUsersCount > 0 ? (double) totalTodos / totalUsersCount : 0);

        return ResponseEntity.ok(stats);
    }

    // Get recent activity (last 10 todos)
    @GetMapping("/activity/recent")
    public ResponseEntity<List<Todo>> getRecentActivity() {
        List<Todo> recentTodos = todoRepository.findAll().stream()
                .sorted((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()))
                .limit(10)
                .toList();
        return ResponseEntity.ok(recentTodos);
    }

    // Delete any todo (admin privilege)
    @DeleteMapping("/todos/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Integer id) {
        if (todoRepository.existsById(id)) {
            todoRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}