package com.todo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarConnectionStatusResponse {
    private boolean connected;
    private boolean syncEnabled;
    private String calendarId;
    private LocalDateTime connectedAt;
    private LocalDateTime lastUpdated;
}