package com.todo.controller;

import com.todo.entity.Subtask;
import com.todo.service.SubtaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/subtasks")
@CrossOrigin(origins = "http://localhost:3000")
public class SubtaskController {

    @Autowired
    private SubtaskService subtaskService;

    // CREATE - Add new subtask to a todo
    @PostMapping
    public ResponseEntity<Subtask> createSubtask(@RequestBody Subtask subtask) {
        Subtask createdSubtask = subtaskService.createSubtask(subtask);
        return new ResponseEntity<>(createdSubtask, HttpStatus.CREATED);
    }

    // READ - Get all subtasks for a specific todo
    @GetMapping("/todo/{todoId}")
    public ResponseEntity<List<Subtask>> getSubtasksByTodoId(@PathVariable Integer todoId) {
        List<Subtask> subtasks = subtaskService.getSubtasksByTodoId(todoId);
        return new ResponseEntity<>(subtasks, HttpStatus.OK);
    }

    // READ - Get a single subtask
    @GetMapping("/{id}")
    public ResponseEntity<Subtask> getSubtaskById(@PathVariable Integer id) {
        Optional<Subtask> subtask = subtaskService.getSubtaskById(id);
        return subtask.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // UPDATE - Update a subtask (usually toggle completion)
    @PutMapping("/{id}")
    public ResponseEntity<Subtask> updateSubtask(@PathVariable Integer id, @RequestBody Subtask subtaskDetails) {
        Subtask updatedSubtask = subtaskService.updateSubtask(id, subtaskDetails);
        if (updatedSubtask != null) {
            return new ResponseEntity<>(updatedSubtask, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // DELETE - Delete a subtask
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubtask(@PathVariable Integer id) {
        boolean deleted = subtaskService.deleteSubtask(id);
        if (deleted) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // GET - Get completion stats for a todo
    @GetMapping("/todo/{todoId}/stats")
    public ResponseEntity<SubtaskService.SubtaskStats> getSubtaskStats(@PathVariable Integer todoId) {
        SubtaskService.SubtaskStats stats = subtaskService.getSubtaskStats(todoId);
        return new ResponseEntity<>(stats, HttpStatus.OK);
    }
}