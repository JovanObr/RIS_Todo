package com.todo.service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.todo.entity.GoogleCalendarToken;
import com.todo.entity.Todo;
import com.todo.repository.GoogleCalendarTokenRepository;
import com.todo.repository.TodoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class GoogleCalendarService {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(CalendarScopes.CALENDAR_EVENTS);

    @Value("${google.calendar.client.id}")
    private String clientId;

    @Value("${google.calendar.client.secret}")
    private String clientSecret;

    @Value("${google.calendar.redirect.uri}")
    private String redirectUri;

    @Value("${google.calendar.application.name}")
    private String applicationName;

    @Autowired
    private GoogleCalendarTokenRepository tokenRepository;

    @Autowired
    private TodoRepository todoRepository;

    /**
     * Generate OAuth2 authorization URL for user to connect their Google Calendar
     */
    public String getAuthorizationUrl(Integer userId) throws GeneralSecurityException, IOException {
        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                httpTransport, JSON_FACTORY, clientId, clientSecret, SCOPES)
                .setAccessType("offline")
                .build();

        String authorizationUrl = flow.newAuthorizationUrl()
                .setRedirectUri(redirectUri)
                .setState(userId.toString()) // Pass userId in state for callback
                .build();

        log.info("Generated authorization URL for user: {}", userId);
        return authorizationUrl;
    }

    /**
     * Handle OAuth2 callback and exchange authorization code for tokens
     */
    @Transactional
    public void handleOAuthCallback(String code, Integer userId) throws IOException, GeneralSecurityException {
        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

        // Exchange authorization code for tokens
        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                httpTransport,
                JSON_FACTORY,
                clientId,
                clientSecret,
                code,
                redirectUri
        ).execute();

        String accessToken = tokenResponse.getAccessToken();
        String refreshToken = tokenResponse.getRefreshToken();
        Long expiresInSeconds = tokenResponse.getExpiresInSeconds();

        // Calculate token expiry time
        LocalDateTime tokenExpiry = LocalDateTime.now().plusSeconds(expiresInSeconds);

        // Save or update tokens in database
        Optional<GoogleCalendarToken> existingToken = tokenRepository.findByUserId(userId);
        GoogleCalendarToken calendarToken;

        if (existingToken.isPresent()) {
            calendarToken = existingToken.get();
            calendarToken.setAccessToken(accessToken);
            if (refreshToken != null) { // Refresh token only provided on first auth
                calendarToken.setRefreshToken(refreshToken);
            }
            calendarToken.setTokenExpiry(tokenExpiry);
            calendarToken.setIsSyncEnabled(true);
        } else {
            calendarToken = new GoogleCalendarToken();
            calendarToken.setUserId(userId);
            calendarToken.setAccessToken(accessToken);
            calendarToken.setRefreshToken(refreshToken);
            calendarToken.setTokenExpiry(tokenExpiry);
            calendarToken.setCalendarId("primary"); // Use primary calendar by default
            calendarToken.setIsSyncEnabled(true);
        }

        tokenRepository.save(calendarToken);
        log.info("Saved Google Calendar tokens for user: {}", userId);
    }

    /**
     * Auto-connect Google Calendar for users who signed in with Google OAuth
     * Note: This only marks readiness. Users still need to explicitly authorize calendar access
     * because OAuth login scopes (profile,email) differ from calendar scopes (calendar.events)
     */
    @Transactional
    public void autoConnectGoogleCalendar(Integer userId, String googleProviderId) {
        try {
            // Check if already connected
            if (tokenRepository.existsByUserId(userId)) {
                log.info("User {} already has Google Calendar connected", userId);
                return;
            }

            log.info("User {} signed in with Google. Calendar connection available.", userId);
            // Users who sign in with Google can easily connect their calendar later
            // They just need to go through the calendar authorization flow
            
        } catch (Exception e) {
            log.error("Failed to prepare Google Calendar connection: {}", e.getMessage(), e);
        }
    }

    /**
     * Check if user has connected their Google Calendar
     */
    public boolean isCalendarConnected(Integer userId) {
        return tokenRepository.existsByUserId(userId);
    }

    /**
     * Get calendar service instance with valid credentials
     */
    private Calendar getCalendarService(Integer userId) throws IOException, GeneralSecurityException {
        GoogleCalendarToken token = tokenRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Google Calendar not connected for user: " + userId));

        // Check if token is expired and refresh if needed
        if (token.getTokenExpiry().isBefore(LocalDateTime.now())) {
            refreshAccessToken(userId);
            token = tokenRepository.findByUserId(userId).get();
        }

        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

        Credential credential = new Credential.Builder(com.google.api.client.auth.oauth2.BearerToken.authorizationHeaderAccessMethod())
                .setTransport(httpTransport)
                .setJsonFactory(JSON_FACTORY)
                .setTokenServerEncodedUrl("https://oauth2.googleapis.com/token")
                .setClientAuthentication(new com.google.api.client.http.HttpExecuteInterceptor() {
                    @Override
                    public void intercept(com.google.api.client.http.HttpRequest request) throws IOException {
                        // No-op, credentials set via bearer token
                    }
                })
                .build();

        credential.setAccessToken(token.getAccessToken());

        return new Calendar.Builder(httpTransport, JSON_FACTORY, credential)
                .setApplicationName(applicationName)
                .build();
    }

    /**
     * Refresh expired access token using refresh token
     */
    @Transactional
    public void refreshAccessToken(Integer userId) throws IOException, GeneralSecurityException {
        GoogleCalendarToken token = tokenRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No tokens found for user: " + userId));

        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                httpTransport,
                JSON_FACTORY,
                clientId,
                clientSecret,
                token.getRefreshToken(),
                ""
        ).setGrantType("refresh_token").execute();

        String newAccessToken = tokenResponse.getAccessToken();
        Long expiresInSeconds = tokenResponse.getExpiresInSeconds();
        LocalDateTime newTokenExpiry = LocalDateTime.now().plusSeconds(expiresInSeconds);

        token.setAccessToken(newAccessToken);
        token.setTokenExpiry(newTokenExpiry);
        tokenRepository.save(token);

        log.info("Refreshed access token for user: {}", userId);
    }

    /**
     * Sync a todo to Google Calendar (create or update event)
     */
    @Transactional
    public void syncTodoToCalendar(Todo todo, Integer userId) {
        try {
            GoogleCalendarToken token = tokenRepository.findByUserId(userId).orElse(null);

            // Check if sync is enabled for this user
            if (token == null || !token.getIsSyncEnabled()) {
                log.info("Calendar sync disabled for user: {}", userId);
                return;
            }

            Calendar calendarService = getCalendarService(userId);

            Event event = createEventFromTodo(todo);

            if (todo.getGoogleCalendarEventId() != null) {
                // Update existing event
                calendarService.events()
                        .update(token.getCalendarId(), todo.getGoogleCalendarEventId(), event)
                        .execute();
                log.info("Updated calendar event for todo: {}", todo.getId());
            } else {
                // Create new event
                Event createdEvent = calendarService.events()
                        .insert(token.getCalendarId(), event)
                        .execute();

                // Save event ID to todo
                todo.setGoogleCalendarEventId(createdEvent.getId());
                todoRepository.save(todo);
                log.info("Created calendar event for todo: {}", todo.getId());
            }
        } catch (Exception e) {
            log.error("Failed to sync todo to calendar: {}", e.getMessage(), e);
            // Don't throw exception - we don't want calendar sync to break todo operations
        }
    }

    /**
     * Delete todo from Google Calendar
     */
    @Transactional
    public void deleteTodoFromCalendar(Todo todo, Integer userId) {
        try {
            if (todo.getGoogleCalendarEventId() == null) {
                return; // Not synced to calendar
            }

            GoogleCalendarToken token = tokenRepository.findByUserId(userId).orElse(null);
            if (token == null) {
                return;
            }

            Calendar calendarService = getCalendarService(userId);
            calendarService.events()
                    .delete(token.getCalendarId(), todo.getGoogleCalendarEventId())
                    .execute();

            log.info("Deleted calendar event for todo: {}", todo.getId());
        } catch (Exception e) {
            log.error("Failed to delete todo from calendar: {}", e.getMessage(), e);
        }
    }

    /**
     * Sync all todos for a user to Google Calendar
     */
    @Transactional
    public int syncAllTodos(Integer userId) {
        try {
            List<Todo> todos = todoRepository.findTodosByUserIdIs(userId);
            int syncedCount = 0;

            for (Todo todo : todos) {
                syncTodoToCalendar(todo, userId);
                syncedCount++;
            }

            log.info("Synced {} todos to calendar for user: {}", syncedCount, userId);
            return syncedCount;
        } catch (Exception e) {
            log.error("Failed to sync all todos: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Disconnect Google Calendar (delete tokens)
     */
    @Transactional
    public void disconnectCalendar(Integer userId) {
        tokenRepository.deleteByUserId(userId);
        log.info("Disconnected Google Calendar for user: {}", userId);
    }

    /**
     * Update sync settings (enable/disable sync)
     */
    @Transactional
    public void updateSyncSettings(Integer userId, boolean isSyncEnabled) {
        GoogleCalendarToken token = tokenRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Calendar not connected"));

        token.setIsSyncEnabled(isSyncEnabled);
        tokenRepository.save(token);
        log.info("Updated sync settings for user {}: enabled={}", userId, isSyncEnabled);
    }

    /**
     * Get calendar connection status
     */
    public GoogleCalendarToken getConnectionStatus(Integer userId) {
        return tokenRepository.findByUserId(userId).orElse(null);
    }

    /**
     * Helper: Convert Todo to Google Calendar Event
     */
    private Event createEventFromTodo(Todo todo) {
        Event event = new Event()
                .setSummary(todo.getTitle())
                .setDescription(todo.getDescription());

        // Set event time based on todo due date
        if (todo.getDueDate() != null) {
            Date dueDate = Date.from(todo.getDueDate().atZone(ZoneId.systemDefault()).toInstant());
            EventDateTime startDateTime = new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(dueDate));
            EventDateTime endDateTime = new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(dueDate));

            event.setStart(startDateTime);
            event.setEnd(endDateTime);
        } else {
            // If no due date, create all-day event for today
            Date today = new Date();
            EventDateTime startDate = new EventDateTime().setDate(new com.google.api.client.util.DateTime(true, today.getTime(), 0));
            EventDateTime endDate = new EventDateTime().setDate(new com.google.api.client.util.DateTime(true, today.getTime(), 0));

            event.setStart(startDate);
            event.setEnd(endDate);
        }

        // Add todo status to description
        String fullDescription = (todo.getDescription() != null ? todo.getDescription() : "")
                + "\n\nStatus: " + (todo.getIsCompleted() ? "Completed ✓" : "Pending");
        event.setDescription(fullDescription);

        return event;
    }
}