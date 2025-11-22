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

    // CREATE - POST endpoint (works for both guest and authenticated users)
    @PostMapping
    public ResponseEntity<?> createTodo(@RequestBody Todo todo, Authentication authentication) {
        // Guest mode - return the todo without saving to database
        if (authentication == null) {
            // Generate temporary ID (negative to distinguish from DB IDs)
            todo.setId(-(int)(System.currentTimeMillis() % 100000));
            return new ResponseEntity<>(todo, HttpStatus.CREATED);
        }

        // Authenticated user - save to database
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        todo.setUser(user);
        Todo createdTodo = todoService.createTodo(todo);
        return new ResponseEntity<>(createdTodo, HttpStatus.CREATED);
    }

    // READ - GET all todos (only for authenticated users)
    @GetMapping
    public ResponseEntity<?> getAllTodos(Authentication authentication) {
        // Guest mode - return empty list (frontend handles this)
        if (authentication == null) {
            return ResponseEntity.ok(List.of());
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Todo> todos = todoService.getTodosByUserId(user.getId());
        return new ResponseEntity<>(todos, HttpStatus.OK);
    }

    // READ - GET single todo
    @GetMapping("/{id}")
    public ResponseEntity<?> getTodoById(@PathVariable Integer id, Authentication authentication) {
        // Guest mode - frontend handles in-memory todos
        if (authentication == null) {
            return ResponseEntity.ok().build();
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Todo> todo = todoService.getTodoById(id);

        if (todo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (todo.get().getUser() == null || !todo.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        return new ResponseEntity<>(todo.get(), HttpStatus.OK);
    }

    // UPDATE - PUT endpoint
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTodo(@PathVariable Integer id,
                                        @RequestBody Todo todoDetails,
                                        Authentication authentication) {
        // Guest mode - return updated todo without saving
        if (authentication == null) {
            todoDetails.setId(id);
            return new ResponseEntity<>(todoDetails, HttpStatus.OK);
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Todo> existingTodo = todoService.getTodoById(id);

        if (existingTodo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

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

    // DELETE - DELETE endpoint
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTodo(@PathVariable Integer id, Authentication authentication) {
        // Guest mode - return success (frontend handles deletion)
        if (authentication == null) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Todo> existingTodo = todoService.getTodoById(id);

        if (existingTodo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

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