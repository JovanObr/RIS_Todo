package com.todo.service;

import com.todo.entity.Todo;
import com.todo.repository.TodoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class TodoService {

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private GoogleCalendarService calendarService;

    // CREATE - Add a new todo (with calendar sync)
    @Transactional
    public Todo createTodo(Todo todo) {
        Todo savedTodo = todoRepository.save(todo);

        // Sync to Google Calendar (non-blocking)
        if (todo.getUser() != null) {
            try {
                calendarService.syncTodoToCalendar(savedTodo, todo.getUser().getId());
            } catch (Exception e) {
                log.warn("Failed to sync new todo to calendar: {}", e.getMessage());
                // Don't throw - we don't want calendar sync to break todo creation
            }
        }

        return savedTodo;
    }

    // READ - Get all todos
    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }

    // READ - Get todos by user ID
    public List<Todo> getTodosByUserId(Integer userId, String name) {
        if(name == null || name.isEmpty()) {
            return todoRepository.findTodosByUserIdIs(userId);
        }else{
            return todoRepository.findTodosByTitleContainingIgnoreCaseAndUserIdIs(name, userId);
        }
    }

    // READ - Get a single todo by id
    public Optional<Todo> getTodoById(Integer id) {
        return todoRepository.findById(id);
    }

    // UPDATE - Update an existing todo (with calendar sync)
    @Transactional
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

            Todo updatedTodo = todoRepository.save(todo);

            // Sync update to Google Calendar (non-blocking)
            if (todo.getUser() != null) {
                try {
                    calendarService.syncTodoToCalendar(updatedTodo, todo.getUser().getId());
                } catch (Exception e) {
                    log.warn("Failed to sync todo update to calendar: {}", e.getMessage());
                    // Don't throw - we don't want calendar sync to break todo updates
                }
            }

            return updatedTodo;
        }

        return null;
    }

    // DELETE - Delete a todo by id (with calendar sync)
    @Transactional
    public boolean deleteTodo(Integer id) {
        if (todoRepository.existsById(id)) {
            Optional<Todo> todoOpt = todoRepository.findById(id);

            if (todoOpt.isPresent()) {
                Todo todo = todoOpt.get();

                // Delete from Google Calendar first (non-blocking)
                if (todo.getUser() != null && todo.getGoogleCalendarEventId() != null) {
                    try {
                        calendarService.deleteTodoFromCalendar(todo, todo.getUser().getId());
                    } catch (Exception e) {
                        log.warn("Failed to delete todo from calendar: {}", e.getMessage());
                        // Continue with deletion even if calendar sync fails
                    }
                }

                todoRepository.deleteById(id);
                return true;
            }
        }
        return false;
    }
}