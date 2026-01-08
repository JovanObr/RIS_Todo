package com.todo.controller;

import com.todo.dto.CalendarAuthUrlResponse;
import com.todo.dto.CalendarConnectionStatusResponse;
import com.todo.dto.CalendarSyncResultResponse;
import com.todo.entity.GoogleCalendarToken;
import com.todo.entity.User;
import com.todo.service.GoogleCalendarService;
import com.todo.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/calendar")
@Slf4j
public class GoogleCalendarController {

    @Autowired
    private GoogleCalendarService calendarService;

    @Autowired
    private UserService userService;

    @GetMapping("/connect")
    public ResponseEntity<CalendarAuthUrlResponse> connectCalendar(Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String username = authentication.getName();
            User user = userService.getUserByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String authUrl = calendarService.getAuthorizationUrl(user.getId());

            CalendarAuthUrlResponse response = new CalendarAuthUrlResponse();
            response.setAuthorizationUrl(authUrl);
            response.setMessage("Please visit this URL to authorize access to Google Calendar");

            log.info("Generated auth URL for user: {}", username);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error generating auth URL: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/oauth2callback")
    public RedirectView handleOAuthCallback(
            @RequestParam("code") String code,
            @RequestParam("state") String userIdStr) {
        try {
            Integer userId = Integer.parseInt(userIdStr);

            calendarService.handleOAuthCallback(code, userId);

            log.info("Successfully handled OAuth callback for user: {}", userId);

            // Redirect to frontend success page
            return new RedirectView("http://localhost:5173/calendar-connected?success=true");

        } catch (Exception e) {
            log.error("Error handling OAuth callback: {}", e.getMessage(), e);
            return new RedirectView("http://localhost:5173/calendar-connected?success=false&error=" + e.getMessage());
        }
    }

    @GetMapping("/status")
    public ResponseEntity<CalendarConnectionStatusResponse> getConnectionStatus(Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String username = authentication.getName();
            User user = userService.getUserByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            GoogleCalendarToken token = calendarService.getConnectionStatus(user.getId());

            CalendarConnectionStatusResponse response = new CalendarConnectionStatusResponse();

            if (token != null) {
                response.setConnected(true);
                response.setSyncEnabled(token.getIsSyncEnabled());
                response.setCalendarId(token.getCalendarId());
                response.setConnectedAt(token.getCreatedAt());
                response.setLastUpdated(token.getUpdatedAt());
            } else {
                response.setConnected(false);
                response.setSyncEnabled(false);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting connection status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @PostMapping("/sync")
    public ResponseEntity<CalendarSyncResultResponse> syncAllTodos(Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String username = authentication.getName();
            User user = userService.getUserByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if calendar is connected
            if (!calendarService.isCalendarConnected(user.getId())) {
                CalendarSyncResultResponse response = new CalendarSyncResultResponse();
                response.setSuccess(false);
                response.setMessage("Google Calendar not connected");
                response.setSyncedCount(0);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            int syncedCount = calendarService.syncAllTodos(user.getId());

            CalendarSyncResultResponse response = new CalendarSyncResultResponse();
            response.setSuccess(true);
            response.setMessage("Successfully synced todos to Google Calendar");
            response.setSyncedCount(syncedCount);

            log.info("Synced {} todos for user: {}", syncedCount, username);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error syncing todos: {}", e.getMessage(), e);

            CalendarSyncResultResponse response = new CalendarSyncResultResponse();
            response.setSuccess(false);
            response.setMessage("Failed to sync: " + e.getMessage());
            response.setSyncedCount(0);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


    @PutMapping("/sync/toggle")
    public ResponseEntity<?> toggleSync(
            @RequestBody Map<String, Boolean> request,
            Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String username = authentication.getName();
            User user = userService.getUserByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Boolean enabled = request.get("enabled");
            if (enabled == null) {
                return ResponseEntity.badRequest().body("Missing 'enabled' field");
            }

            calendarService.updateSyncSettings(user.getId(), enabled);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("syncEnabled", enabled);
            response.put("message", "Sync " + (enabled ? "enabled" : "disabled"));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error toggling sync: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<?> disconnectCalendar(Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String username = authentication.getName();
            User user = userService.getUserByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            calendarService.disconnectCalendar(user.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Google Calendar disconnected successfully");

            log.info("Disconnected calendar for user: {}", username);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error disconnecting calendar: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}