package com.todo.controller;

import com.todo.entity.Todo;
import com.todo.entity.User;
import com.todo.service.TodoService;
import com.todo.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class TodoControllerUnitTest {

    private TodoController todoController;
    private TodoService todoService;
    private UserService userService;

    @BeforeEach
    void setUp() {
        todoService = Mockito.mock(TodoService.class);
        userService = Mockito.mock(UserService.class);

        todoController = new TodoController();
        todoController.todoService = todoService;
        todoController.userService = userService;
    }

    @Test
    void createTodo_guestUser_returnsTemporaryTodo() {
        Todo todo = new Todo();
        todo.setTitle("Guest todo");

        ResponseEntity<?> response = todoController.createTodo(todo, null);

        assertEquals(201, response.getStatusCodeValue());
        Todo body = (Todo) response.getBody();
        assertNotNull(body);
        assertTrue(body.getId() < 0);
        assertEquals("Guest todo", body.getTitle());
    }

    @Test
    void getTodoById_authenticatedUser_ownsTodo_returnsTodo() {
        User user = new User();
        user.setId(1);
        user.setUsername("pavel");

        Todo todo = new Todo();
        todo.setId(10);
        todo.setTitle("My todo");
        todo.setUser(user);

        Mockito.when(userService.getUserByUsername("pavel"))
                .thenReturn(Optional.of(user));
        Mockito.when(todoService.getTodoById(10))
                .thenReturn(Optional.of(todo));

        Authentication authentication = Mockito.mock(Authentication.class);
        Mockito.when(authentication.getName()).thenReturn("pavel");

        ResponseEntity<?> response = todoController.getTodoById(10, authentication);

        assertEquals(200, response.getStatusCodeValue());
        Todo body = (Todo) response.getBody();
        assertNotNull(body);
        assertEquals(10, body.getId());
        assertEquals("My todo", body.getTitle());
    }

    @Test
    void getTodoById_authenticatedUser_notOwner_returnsForbidden() {
        User user = new User();
        user.setId(1);
        user.setUsername("pavel");

        User other = new User();
        other.setId(2);
        other.setUsername("other");

        Todo todo = new Todo();
        todo.setId(20);
        todo.setTitle("Other's todo");
        todo.setUser(other);

        Mockito.when(userService.getUserByUsername("pavel"))
                .thenReturn(Optional.of(user));
        Mockito.when(todoService.getTodoById(20))
                .thenReturn(Optional.of(todo));

        Authentication authentication = Mockito.mock(Authentication.class);
        Mockito.when(authentication.getName()).thenReturn("pavel");

        ResponseEntity<?> response = todoController.getTodoById(20, authentication);

        assertEquals(403, response.getStatusCodeValue());
        assertEquals("Access denied", response.getBody());
    }
}
