# Testing Documentation

---

## Members of Testing Group

- **JovanObr** - [GitHub Profile](https://github.com/JovanObr)
- **ad-a-dglgmut** - [GitHub Profile](https://github.com/ad-a-dglgmut)
- **DraganS005** - [GitHub Profile](https://github.com/DraganS005)

---

## Tests

### Test 01

- Unit test for createTodo method as a Guest user, returns temporary todo (TodoController)
- Done by: **ad-a-dglgmut**
- No bugs were found, method functions as intended.

### Test 02

- Unit test for getTodoById method as an Authenticated user (owner of todo), returns todo (TodoController)
- Done by: **ad-a-dglgmut**
- No bugs were found, method functions as intended.

### Test 03

- Unit test for getTodoById method as an Authenticated user (not the owner of todo), returns forbidden (TodoController)
- Done by: **ad-a-dglgmut**
- No bugs were found, method functions as intended.

### Test 04

- Unit test for getAllTodos method as Authenticated user, returns all User todos (TodoService)
- Done by: **DraganS005**
- No bugs were found, method functions as intended.

### Test 05

- Unit test for getTodosByUserId method as an Authenticated user, when name filter is empty, returns todos (TodoService)
- Done by: **DraganS005**
- No bugs were found, method functions as intended.

### Test 06

- Unit test for deleteTodo method as an Authenticated user, when todo exists, returns true (TodoService)
- Done by: **DraganS005**
- No bugs were found, method functions as intended.

### Test 07

- Unit test for getAllTodos method as Admin, returns ALL todos (AdminController)
- Done by: **JovanObr**
- No bugs were found, method functions as intended.

### Test 08

- Unit test for getAppStats method as Admin, returns App statistics (AdminController)
- Done by: **JovanObr**
- No bugs were found, method functions as intended.

### Test 09

- Unit test for deleteTodo method as Admin, when todo exists, should successfully delete todo (AdminController)
- Done by: **JovanObr**
- No bugs were found, method functions as intended.

---