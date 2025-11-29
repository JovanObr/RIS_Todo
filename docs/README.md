# Detailed Use Case Descriptions
### Todo Application — Full Functional Specification

This document provides complete, structured, and detailed descriptions of all use cases for the Todo Application.  
It covers Guest, Registered User, and Admin functionality and defines system behavior, flows, exceptions, and state changes.

---

# 📘 Table of Contents

1. [UC-01: View Todos](#uc-01-view-todos)
2. [UC-02: Create Todo](#uc-02-create-todo)
3. [UC-03: Update Todo](#uc-03-update-todo)
4. [UC-04: Delete Todo](#uc-04-delete-todo)
5. [UC-05: View Todo Subtasks](#uc-05-view-todo-subtasks)
6. [UC-06: Create Todo Subtask](#uc-06-create-todo-subtask)
7. [UC-07: Toggle Completion](#uc-07-toggle-completion)
8. [UC-08: Delete Todo Subtask](#uc-08-delete-todo-subtask)
9. [UC-09: Search Todos](#uc-09-search-todos)
10. [UC-10: Filter Todos](#uc-10-filter-todos)
11. [UC-11: View Registered Users](#uc-11-view-registered-users)
12. [UC-12: Delete User](#uc-12-delete-user)
13. [UC-13: View All Todos](#uc-13-view-all-todos)
14. [UC-14: View App Metadata](#uc-14-view-app-metadata)
15. [UC-15: Select User](#uc-15-select-user)
16. [Summary Table](#summary-table)

---

# UC-01: View Todos

**ID:** UC-01  
**Goal:** Allow users to see their list of todos  
**Actors:** User (Guest), Registered User, Admin

### Prerequisites
- Guest: none
- Registered User: valid JWT token
- Admin: must be authenticated as ADMIN

### System State After
- No DB changes
- Todo list retrieved or empty list returned

### Main Scenario
1. User navigates to todo page
2. System checks authentication
3. Guest → empty list
4. Registered User → loads user’s todos
5. Admin → loads admin's own todos
6. Frontend displays todos

### Alternative Flows
- Guest mode → banner + empty list
- Admin wanting all todos → UC-13

### Exceptions
- DB error → show error
- Token expired → 401 redirect to login

---

# UC-02: Create Todo

**Actors:** Guest, Registered User  
**Goal:** Create new todo

### State After
- Guest → todo saved in sessionStorage
- Registered User → todo saved in DB

### Main Scenario
1. User clicks add
2. System displays input form
3. User enters details
4. Validation
5. Guest → temporary ID
6. Registered User → DB entry
7. Todo added to list

### Exceptions
- Empty title
- Authentication failure
- DB error

---

# UC-03: Update Todo

**Actors:** Guest, Registered User  
**Goal:** Modify an existing todo

### State After
- Updated todo saved (DB or sessionStorage)

### Main Scenario
1. User clicks edit
2. Ownership verified
3. Form pre-filled
4. User updates data
5. Save & validate
6. System updates todo

### Exceptions
- Not found
- Validation fail
- Access denied

---

# UC-04: Delete Todo

**Actors:** Guest, Registered User  
**Goal:** Delete an existing todo

### State After
- Todo removed
- Registered User → DB row deleted + subtasks cascade

### Main Scenario
1. User clicks delete
2. Confirm dialog
3. Ownership check
4. Delete
5. Success message

---

# UC-05: View Todo Subtasks

**Actors:** Registered User  
**Goal:** View subtasks of a todo

### State After
- Subtasks loaded; no DB changes

### Main Scenario
- Expand todo → load subtasks
- Calculate completion stats
- Render subtasks + progress bar

---

# UC-06: Create Todo Subtask

**Actors:** Registered User  
**Goal:** Add subtask to a todo

### State After
- Subtask stored in DB
- Progress recalculated

### Main Scenario
- Enter title → validate → insert into DB → update UI

---

# UC-07: Toggle Completion

**Actors:** Registered User  
**Goal:** Mark subtask complete/incomplete

### State After
- Subtask `isDone` toggled
- Progress recalculated

### Main Scenario
- User checks/unchecks → update DB → update UI

---

# UC-08: Delete Todo Subtask

**Actors:** Registered User  
**Goal:** Remove a subtask

### State After
- Subtask deleted
- Progress updated

---

# UC-09: Search Todos

**Actors:** Registered User  
**Goal:** Find todos by keyword

### State After
- Temp filtered list displayed

### Search targets
- Title
- Description

---

# UC-10: Filter Todos

**Actors:** Registered User  
**Goal:** Filter todos via various attributes

### Filters
- Status
- Due date ranges
- Custom date range

---

# UC-11: View Registered Users

**Actors:** Admin  
**Goal:** View list of registered users

### State After
- None (read-only)

### Main Scenario
- Validate admin → list all users → display metadata

---

# UC-12: Delete User

**Actors:** Admin  
**Goal:** Remove a user and all their data

### State After
- User removed
- All todos + subtasks removed (cascade)

---

# UC-13: View All Todos

**Actors:** Admin  
**Goal:** View todos from all users

### State After
- None (read-only)

---

# UC-14: View App Metadata

**Actors:** Admin  
**Goal:** Display system statistics

### Statistics Include
- Total users
- Total admins
- Total todos
- Completed/pending todos
- Completion rate
- Total subtasks
- Completed/pending subtasks
- Average todos per user

---

# UC-15: Select User

**Actors:** Admin  
**Goal:** Select a specific user for actions

---

# Summary Table

| ID | Use Case | Actors | Auth Required | Persistent |
|----|----------|---------|----------------|------------|
| UC-01 | View Todos | User, Registered, Admin | Optional | Read-only |
| UC-02 | Create Todo | User, Registered | Optional | Yes (registered) |
| UC-03 | Update Todo | User, Registered | Optional | Yes (registered) |
| UC-04 | Delete Todo | User, Registered | Optional | Yes (registered) |
| UC-05 | View Subtasks | Registered | Required | Read-only |
| UC-06 | Create Subtask | Registered | Required | Yes |
| UC-07 | Toggle Completion | Registered | Required | Yes |
| UC-08 | Delete Subtask | Registered | Required | Yes |
| UC-09 | Search Todos | Registered | Required | Read-only |
| UC-10 | Filter Todos | Registered | Required | Read-only |
| UC-11 | View Users | Admin | Required | Read-only |
| UC-12 | Delete User | Admin | Required | Yes |
| UC-13 | View All Todos | Admin | Required | Read-only |
| UC-14 | View App Metadata | Admin | Required | Read-only |
| UC-15 | Select User | Admin | Required | Read-only |

---
