package com.todo.service;

import com.todo.entity.Todo;
import com.todo.repository.TodoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("TodoService Unit Tests")
class TodoServiceTest {

    @Mock
    private TodoRepository todoRepository;

    @InjectMocks
    private TodoService todoService;

    private Todo todo1;
    private Todo todo2;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        todo1 = new Todo();
        todo1.setId(1);
        todo1.setTitle("First Todo");
        todo1.setIsCompleted(false);

        todo2 = new Todo();
        todo2.setId(2);
        todo2.setTitle("Second Todo");
        todo2.setIsCompleted(true);
    }

    @Test
    @DisplayName("Should return all todos")
    void getAllTodos_ShouldReturnTodos() {
        // Arrange
        when(todoRepository.findAll()).thenReturn(Arrays.asList(todo1, todo2));

        // Act
        List<Todo> result = todoService.getAllTodos();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(todoRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should return todos for user when name filter is empty")
    void getTodosByUserId_NoNameFilter() {
        // Arrange
        when(todoRepository.findTodosByUserIdIs(1))
                .thenReturn(List.of(todo1));

        // Act
        List<Todo> result = todoService.getTodosByUserId(1, "");

        // Assert
        assertEquals(1, result.size());
        assertEquals("First Todo", result.get(0).getTitle());
        verify(todoRepository, times(1)).findTodosByUserIdIs(1);
    }

    @Test
    @DisplayName("Should delete todo when it exists")
    void deleteTodo_WhenExists_ShouldReturnTrue() {
        // Arrange
        when(todoRepository.existsById(1)).thenReturn(true);
        doNothing().when(todoRepository).deleteById(1);

        // Act
        boolean deleted = todoService.deleteTodo(1);

        // Assert
        assertTrue(deleted);
        verify(todoRepository, times(1)).existsById(1);
        verify(todoRepository, times(1)).deleteById(1);
    }
}
