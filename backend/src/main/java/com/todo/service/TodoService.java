package com.todo.service;

import com.todo.entity.Todo;
import com.todo.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TodoService {

    @Autowired
    private TodoRepository todoRepository;

    // CREATE - Add a new todo
    public Todo createTodo(Todo todo) {
        return todoRepository.save(todo);
    }

    // READ - Get all todos
    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }

    // READ - Get todos by user ID
    public List<Todo> getTodosByUserId(Integer userId) {
        return todoRepository.findAll().stream()
                .filter(todo -> todo.getUser() != null && todo.getUser().getId().equals(userId))
                .toList();
    }

    // READ - Get a single todo by id
    public Optional<Todo> getTodoById(Integer id) {
        return todoRepository.findById(id);
    }

    // UPDATE - Update an existing todo
    public Todo updateTodo(Integer id, Todo todoDetails) {
        Optional<Todo> optionalTodo = todoRepository.findById(id);

        if (optionalTodo.isPresent()) {
            Todo todo = optionalTodo.get();

            if (todoDetails.getTitle() != null) {
                todo.setTitle(todoDetails.getTitle());
            }
            if (todoDetails.getDescription() != null) {
                todo.setDescription(todoDetails.getDescription());
            }
            if (todoDetails.getIsCompleted() != null) {
                todo.setIsCompleted(todoDetails.getIsCompleted());
            }
            if (todoDetails.getDueDate() != null) {
                todo.setDueDate(todoDetails.getDueDate());
            }

            return todoRepository.save(todo);
        }

        return null;
    }

    // DELETE - Delete a todo by id
    public boolean deleteTodo(Integer id) {
        if (todoRepository.existsById(id)) {
            todoRepository.deleteById(id);
            return true;
        }
        return false;
    }
}