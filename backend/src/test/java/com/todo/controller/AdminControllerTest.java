package com.todo.controller;

import com.todo.entity.Todo;
import com.todo.entity.User;
import com.todo.entity.Role;
import com.todo.entity.Subtask;
import com.todo.repository.TodoRepository;
import com.todo.repository.SubtaskRepository;
import com.todo.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("AdminController Unit Tests")
class AdminControllerTest {

    @Mock
    private TodoRepository todoRepository;

    @Mock
    private SubtaskRepository subtaskRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private AdminController adminController;

    private User testUser1;
    private Todo testTodo1;
    private Todo testTodo2;
    private Subtask testSubtask1;
    private Subtask testSubtask2;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Create test user
        testUser1 = new User();
        testUser1.setId(1);
        testUser1.setUsername("user1");
        testUser1.setEmail("user1@test.com");
        testUser1.setRole(Role.USER);
        testUser1.setIsActive(true);

        // Create test todos
        testTodo1 = new Todo();
        testTodo1.setId(1);
        testTodo1.setTitle("Todo 1");
        testTodo1.setDescription("Description 1");
        testTodo1.setIsCompleted(false);
        testTodo1.setUser(testUser1);
        testTodo1.setCreatedAt(LocalDateTime.now().minusDays(2));

        testTodo2 = new Todo();
        testTodo2.setId(2);
        testTodo2.setTitle("Todo 2");
        testTodo2.setDescription("Description 2");
        testTodo2.setIsCompleted(true);
        testTodo2.setUser(testUser1);
        testTodo2.setCreatedAt(LocalDateTime.now().minusDays(1));

        // Create test subtasks
        testSubtask1 = new Subtask();
        testSubtask1.setId(1);
        testSubtask1.setTodoId(1);
        testSubtask1.setTitle("Subtask 1");
        testSubtask1.setIsCompleted(true);

        testSubtask2 = new Subtask();
        testSubtask2.setId(2);
        testSubtask2.setTodoId(1);
        testSubtask2.setTitle("Subtask 2");
        testSubtask2.setIsCompleted(false);
    }

    @Test
    @DisplayName("Should return all todos from all users")
    void getAllTodos_ShouldReturnAllTodos() {
        // Arrange
        List<Todo> allTodos = Arrays.asList(testTodo1, testTodo2);
        when(todoRepository.findAll()).thenReturn(allTodos);

        // Act
        ResponseEntity<List<Todo>> response = adminController.getAllTodos();

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        assertTrue(response.getBody().contains(testTodo1));
        assertTrue(response.getBody().contains(testTodo2));
        verify(todoRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should return comprehensive application statistics")
    void getAppStats_ShouldReturnCorrectStatistics() {
        // Arrange
        List<Todo> allTodos = Arrays.asList(testTodo1, testTodo2);
        List<Subtask> allSubtasks = Arrays.asList(testSubtask1, testSubtask2);

        when(userService.getTotalUsers()).thenReturn(10L);
        when(userService.getRegularUsersCount()).thenReturn(8L);
        when(userService.getAdminUsersCount()).thenReturn(2L);
        when(todoRepository.count()).thenReturn(2L);
        when(todoRepository.findAll()).thenReturn(allTodos);
        when(subtaskRepository.count()).thenReturn(2L);
        when(subtaskRepository.findAll()).thenReturn(allSubtasks);

        // Act
        ResponseEntity<Map<String, Object>> response = adminController.getAppStats();

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> stats = response.getBody();

        // Verify user statistics
        assertEquals(10L, stats.get("totalUsers"));
        assertEquals(8L, stats.get("regularUsers"));
        assertEquals(2L, stats.get("adminUsers"));

        // Verify todo statistics
        assertEquals(2L, stats.get("totalTodos"));
        assertEquals(1L, stats.get("completedTodos"));
        assertEquals(1L, stats.get("pendingTodos"));
        assertEquals(50.0, (Double) stats.get("completionRate"), 0.01);

        // Verify subtask statistics
        assertEquals(2L, stats.get("totalSubtasks"));
        assertEquals(1L, stats.get("completedSubtasks"));
        assertEquals(1L, stats.get("pendingSubtasks"));

        // Verify average calculation
        assertEquals(0.2, (Double) stats.get("avgTodosPerUser"), 0.01);

        // Verify all repository/service calls
        verify(userService, times(2)).getTotalUsers();
        verify(userService, times(1)).getRegularUsersCount();
        verify(userService, times(1)).getAdminUsersCount();
        verify(todoRepository, times(1)).count();
        verify(todoRepository, times(1)).findAll();
        verify(subtaskRepository, times(1)).count();
        verify(subtaskRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should delete todo successfully when it exists")
    void deleteTodo_ShouldDeleteSuccessfully() {
        // Arrange
        when(todoRepository.existsById(1)).thenReturn(true);
        doNothing().when(todoRepository).deleteById(1);

        // Act
        ResponseEntity<Void> response = adminController.deleteTodo(1);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(todoRepository, times(1)).existsById(1);
        verify(todoRepository, times(1)).deleteById(1);
    }
}