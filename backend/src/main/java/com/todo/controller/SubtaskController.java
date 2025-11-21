package com.todo.controller;

import com.todo.entity.Subtask;
import com.todo.entity.Todo;
import com.todo.entity.User;
import com.todo.service.SubtaskService;
import com.todo.service.TodoService;
import com.todo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/subtasks")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class SubtaskController {

    @Autowired
    private SubtaskService subtaskService;

    @Autowired
    private TodoService todoService;

    @Autowired
    private UserService userService;

    // CREATE - Add new subtask to a todo
    @PostMapping
    public ResponseEntity<?> createSubtask(@RequestBody Subtask subtask, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        // Verify the parent todo belongs to current user
        Optional<Todo> todo = todoService.getTodoById(subtask.getTodoId());
        if (todo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (todo.get().getUser() == null || !todo.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        Subtask createdSubtask = subtaskService.createSubtask(subtask);
        return new ResponseEntity<>(createdSubtask, HttpStatus.CREATED);
    }

    // READ - Get all subtasks for a specific todo
    @GetMapping("/todo/{todoId}")
    public ResponseEntity<?> getSubtasksByTodoId(@PathVariable Integer todoId, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        // Verify the parent todo belongs to current user
        Optional<Todo> todo = todoService.getTodoById(todoId);
        if (todo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (todo.get().getUser() == null || !todo.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        List<Subtask> subtasks = subtaskService.getSubtasksByTodoId(todoId);
        return new ResponseEntity<>(subtasks, HttpStatus.OK);
    }

    // READ - Get a single subtask
    @GetMapping("/{id}")
    public ResponseEntity<?> getSubtaskById(@PathVariable Integer id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        Optional<Subtask> subtask = subtaskService.getSubtaskById(id);
        if (subtask.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Verify the parent todo belongs to current user
        Optional<Todo> todo = todoService.getTodoById(subtask.get().getTodoId());
        if (todo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (todo.get().getUser() == null || !todo.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        return new ResponseEntity<>(subtask.get(), HttpStatus.OK);
    }

    // UPDATE - Update a subtask
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSubtask(@PathVariable Integer id,
                                           @RequestBody Subtask subtaskDetails,
                                           Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        Optional<Subtask> existingSubtask = subtaskService.getSubtaskById(id);
        if (existingSubtask.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Verify the parent todo belongs to current user
        Optional<Todo> todo = todoService.getTodoById(existingSubtask.get().getTodoId());
        if (todo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (todo.get().getUser() == null || !todo.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        Subtask updatedSubtask = subtaskService.updateSubtask(id, subtaskDetails);
        if (updatedSubtask != null) {
            return new ResponseEntity<>(updatedSubtask, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // DELETE - Delete a subtask
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubtask(@PathVariable Integer id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        Optional<Subtask> existingSubtask = subtaskService.getSubtaskById(id);
        if (existingSubtask.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Verify the parent todo belongs to current user
        Optional<Todo> todo = todoService.getTodoById(existingSubtask.get().getTodoId());
        if (todo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (todo.get().getUser() == null || !todo.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        boolean deleted = subtaskService.deleteSubtask(id);
        if (deleted) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // GET - Get completion stats for a todo
    @GetMapping("/todo/{todoId}/stats")
    public ResponseEntity<?> getSubtaskStats(@PathVariable Integer todoId, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        // Verify the parent todo belongs to current user
        Optional<Todo> todo = todoService.getTodoById(todoId);
        if (todo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (todo.get().getUser() == null || !todo.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        SubtaskService.SubtaskStats stats = subtaskService.getSubtaskStats(todoId);
        return new ResponseEntity<>(stats, HttpStatus.OK);
    }
}