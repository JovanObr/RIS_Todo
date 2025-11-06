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

    // CREATE
    public Todo createTodo(Todo todo) {
        return todoRepository.save(todo);
    }

    // READ
    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }

    // READ
    public Optional<Todo> getTodoById(Integer id) {
        return todoRepository.findById(id);
    }

    // UPDATE
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

    // DELETE
    public boolean deleteTodo(Integer id) {
        if (todoRepository.existsById(id)) {
            todoRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
