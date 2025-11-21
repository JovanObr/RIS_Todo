package com.todo.controller;

import com.todo.entity.Todo;
import com.todo.entity.User;
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
@RequestMapping("/todos")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class TodoController {

    @Autowired
    private TodoService todoService;

    @Autowired
    private UserService userService;

    // CREATE - POST endpoint to add a new todo
    @PostMapping
    public ResponseEntity<?> createTodo(@RequestBody Todo todo, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        todo.setUser(user);
        Todo createdTodo = todoService.createTodo(todo);
        return new ResponseEntity<>(createdTodo, HttpStatus.CREATED);
    }

    // READ - GET all todos for current user
    @GetMapping
    public ResponseEntity<?> getAllTodos(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Todo> todos = todoService.getTodosByUserId(user.getId());
        return new ResponseEntity<>(todos, HttpStatus.OK);
    }

    // READ - GET a single todo by id (only if it belongs to current user)
    @GetMapping("/{id}")
    public ResponseEntity<?> getTodoById(@PathVariable Integer id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Todo> todo = todoService.getTodoById(id);

        if (todo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Check if todo belongs to current user
        if (todo.get().getUser() == null || !todo.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        return new ResponseEntity<>(todo.get(), HttpStatus.OK);
    }

    // UPDATE - PUT endpoint to update a todo
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTodo(@PathVariable Integer id,
                                        @RequestBody Todo todoDetails,
                                        Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Todo> existingTodo = todoService.getTodoById(id);

        if (existingTodo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Check if todo belongs to current user
        if (existingTodo.get().getUser() == null ||
                !existingTodo.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        Todo updatedTodo = todoService.updateTodo(id, todoDetails);
        if (updatedTodo != null) {
            return new ResponseEntity<>(updatedTodo, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // DELETE - DELETE endpoint to remove a todo
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTodo(@PathVariable Integer id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Todo> existingTodo = todoService.getTodoById(id);

        if (existingTodo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Check if todo belongs to current user
        if (existingTodo.get().getUser() == null ||
                !existingTodo.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        boolean deleted = todoService.deleteTodo(id);
        if (deleted) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}