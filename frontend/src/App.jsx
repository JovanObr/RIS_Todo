import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import GuestWarning from './components/GuestWarning';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

const API_URL = 'http://localhost:8080/api/todos';
const SUBTASK_API_URL = 'http://localhost:8080/api/subtasks';

function App() {
    const { isAuthenticated } = useAuth();
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expandedTodoId, setExpandedTodoId] = useState(null);
    const [subtasks, setSubtasks] = useState({});
    const [newSubtaskText, setNewSubtaskText] = useState({});
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [isSearching, setIsSearching] = useState(false); 
    const [originalTodos, setOriginalTodos] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        isCompleted: false,
        dueDate: ''
    });

    useEffect(() => {
        if (isAuthenticated) {
            fetchAllTodos();
        } else {
            const guestTodos = sessionStorage.getItem('guestTodos');
            if (guestTodos) {
                const parsedTodos = JSON.parse(guestTodos);
                setTodos(parsedTodos);
                setOriginalTodos(parsedTodos); 
            }
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated && todos.length > 0) {
            sessionStorage.setItem('guestTodos', JSON.stringify(todos));
        }
    }, [todos, isAuthenticated]);

    const fetchAllTodos = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL);
            setTodos(response.data);
            setOriginalTodos(response.data); 
            setIsSearching(false); 
            setSearchTerm(''); 
            setSearchError(''); 
        } catch (error) {
            console.error('Error fetching todos:', error);
            if (isAuthenticated) {
                alert('Failed to fetch todos');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            alert('Please enter a search term');
            return;
        }

        try {
            setSearchLoading(true);
            setSearchError('');
            
            if (isAuthenticated) {
                const response = await axios.get(`${API_URL}?name=${encodeURIComponent(searchTerm.trim())}`);
                setTodos(response.data);
                setIsSearching(true);
            } else {
                const filtered = originalTodos.filter(todo =>
                    todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                setTodos(filtered);
                setIsSearching(true);
            }
        } catch (error) {
            console.error('Error searching todos:', error);
            setSearchError('Failed to search todos. Please try again.');
            alert('Failed to search todos');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleResetSearch = () => {
        if (isAuthenticated) {
            fetchAllTodos();
        } else {
            setTodos(originalTodos);
            setIsSearching(false);
            setSearchTerm('');
            setSearchError('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const fetchTodoById = async (id) => {
        if (!isAuthenticated) {
            const todo = todos.find(t => t.id === id);
            if (todo) {
                setFormData({
                    title: todo.title,
                    description: todo.description,
                    isCompleted: todo.isCompleted,
                    dueDate: todo.dueDate ? todo.dueDate.slice(0, 16) : ''
                });
                setEditingId(id);
            }
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/${id}`);
            setFormData({
                title: response.data.title,
                description: response.data.description,
                isCompleted: response.data.isCompleted,
                dueDate: response.data.dueDate ? response.data.dueDate.slice(0, 16) : ''
            });
            setEditingId(id);
        } catch (error) {
            console.error('Error fetching todo:', error);
            alert('Failed to fetch todo');
        }
    };

    // SUBTASK FUNCTIONS (only for authenticated users)
    const fetchSubtasks = async (todoId) => {
        if (!isAuthenticated) return;

        try {
            const response = await axios.get(`${SUBTASK_API_URL}/todo/${todoId}`);
            setSubtasks(prev => ({ ...prev, [todoId]: response.data }));
        } catch (error) {
            console.error('Error fetching subtasks:', error);
        }
    };

    const toggleSubtaskExpand = (todoId) => {
        if (!isAuthenticated) {
            alert('Subtasks are only available for registered users. Please login or register.');
            return;
        }

        if (expandedTodoId === todoId) {
            setExpandedTodoId(null);
        } else {
            setExpandedTodoId(todoId);
            if (!subtasks[todoId]) {
                fetchSubtasks(todoId);
            }
        }
    };

    const addSubtask = async (todoId) => {
        if (!isAuthenticated) return;

        const text = newSubtaskText[todoId];
        if (!text || !text.trim()) {
            alert('Please enter subtask text');
            return;
        }

        try {
            const newSubtask = {
                todoId: todoId,
                title: text.trim(),
                isCompleted: false,
                position: subtasks[todoId] ? subtasks[todoId].length : 0
            };

            await axios.post(SUBTASK_API_URL, newSubtask);
            setNewSubtaskText(prev => ({ ...prev, [todoId]: '' }));
            fetchSubtasks(todoId);
        } catch (error) {
            console.error('Error adding subtask:', error);
            alert('Failed to add subtask');
        }
    };

    const toggleSubtaskCompletion = async (subtask) => {
        if (!isAuthenticated) return;

        try {
            const updated = { ...subtask, isCompleted: !subtask.isCompleted };
            await axios.put(`${SUBTASK_API_URL}/${subtask.id}`, updated);
            fetchSubtasks(subtask.todoId);
        } catch (error) {
            console.error('Error updating subtask:', error);
            alert('Failed to update subtask');
        }
    };

    const deleteSubtask = async (subtaskId, todoId) => {
        if (!isAuthenticated) return;

        if (window.confirm('Delete this subtask?')) {
            try {
                await axios.delete(`${SUBTASK_API_URL}/${subtaskId}`);
                fetchSubtasks(todoId);
            } catch (error) {
                console.error('Error deleting subtask:', error);
                alert('Failed to delete subtask');
            }
        }
    };

    const calculateProgress = (todoId) => {
        if (!isAuthenticated) return null;

        const todoSubtasks = subtasks[todoId] || [];
        if (todoSubtasks.length === 0) return null;

        const completed = todoSubtasks.filter(st => st.isCompleted).length;
        const total = todoSubtasks.length;
        const percentage = Math.round((completed / total) * 100);

        return { completed, total, percentage };
    };

    // TODO FUNCTIONS
    const handleAddTodo = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert('Please enter a title');
            return;
        }

        try {
            const newTodo = {
                ...formData,
                dueDate: formData.dueDate ? formData.dueDate : null
            };

            if (isAuthenticated) {
                const response = await axios.post(API_URL, newTodo);
                const updatedTodos = [...todos, response.data];
                setTodos(updatedTodos);
                if (!isSearching) {
                    setOriginalTodos(updatedTodos);
                }
            } else {
                newTodo.id = Date.now();
                newTodo.createdAt = new Date().toISOString();
                const updatedTodos = [...todos, newTodo];
                setTodos(updatedTodos);
                if (!isSearching) {
                    setOriginalTodos(updatedTodos);
                }
            }

            resetForm();
            alert('Todo created successfully!');
        } catch (error) {
            console.error('Error creating todo:', error);
            alert('Failed to create todo');
        }
    };

    const handleUpdateTodo = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert('Please enter a title');
            return;
        }

        try {
            const updatedTodo = {
                ...formData,
                dueDate: formData.dueDate ? formData.dueDate : null
            };

            if (isAuthenticated) {
                const response = await axios.put(`${API_URL}/${editingId}`, updatedTodo);
                const updatedTodos = todos.map(todo =>
                    todo.id === editingId ? response.data : todo
                );
                setTodos(updatedTodos);
                if (!isSearching) {
                    setOriginalTodos(updatedTodos);
                }
            } else {
                // Guest mode - update in local state
                const updatedTodos = todos.map(todo =>
                    todo.id === editingId ? { ...todo, ...updatedTodo } : todo
                );
                setTodos(updatedTodos);
                if (!isSearching) {
                    setOriginalTodos(updatedTodos);
                }
            }

            resetForm();
            alert('Todo updated successfully!');
        } catch (error) {
            console.error('Error updating todo:', error);
            alert('Failed to update todo');
        }
    };

    const handleDeleteTodo = async (id) => {
        if (window.confirm('Are you sure you want to delete this todo?')) {
            try {
                if (isAuthenticated) {
                    await axios.delete(`${API_URL}/${id}`);
                }
                const updatedTodos = todos.filter(todo => todo.id !== id);
                setTodos(updatedTodos);
                if (!isSearching) {
                    setOriginalTodos(updatedTodos);
                }
                alert('Todo deleted successfully!');
            } catch (error) {
                console.error('Error deleting todo:', error);
                alert('Failed to delete todo');
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            isCompleted: false,
            dueDate: ''
        });
        setEditingId(null);
    };

    const handleShowAuth = (mode) => {
        setAuthMode(mode);
        setShowAuthModal(true);
    };

    const handleCloseAuth = () => {
        setShowAuthModal(false);
    };

    return (
        <>
            <Navbar
                onShowAuth={handleShowAuth}
                onShowAdmin={() => setShowAdminDashboard(true)}
            />

            <div className="app-container">
                <header className="header">
                    <h1>📝 My Todo Application</h1>
                    <p>Manage your tasks efficiently with subtasks</p>
                </header>

                <main className="main-content">
                    {/* Guest Warning */}
                    {!isAuthenticated && (
                        <GuestWarning onShowAuth={handleShowAuth} />
                    )}

                    {/* Form Section */}
                    <section className="form-section">
                        <h2>{editingId ? 'Edit Todo' : 'Add New Todo'}</h2>
                        <form onSubmit={editingId ? handleUpdateTodo : handleAddTodo} className="form">
                            <div className="form-group">
                                <label htmlFor="title">Title *</label>
                                <input
                                    id="title"
                                    type="text"
                                    name="title"
                                    placeholder="Enter todo title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Enter todo description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="dueDate">Due Date</label>
                                <input
                                    id="dueDate"
                                    type="datetime-local"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group checkbox">
                                <label htmlFor="isCompleted">
                                    <input
                                        id="isCompleted"
                                        type="checkbox"
                                        name="isCompleted"
                                        checked={formData.isCompleted}
                                        onChange={handleInputChange}
                                    />
                                    Mark as completed
                                </label>
                            </div>

                            <div className="form-buttons">
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Update Todo' : 'Add Todo'}
                                </button>
                                {editingId && (
                                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>

                    {/* Todos List Section */}
                    <section className="todos-section">
                        <h2>Your Todos</h2>
                        
                        {/* Search Bar Section */}
                        <div className="search-section">
                            <div className="search-input-group">
                                <input
                                    type="text"
                                    placeholder="Search todos by title or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="search-input"
                                />
                                <button
                                    className="btn btn-search"
                                    onClick={handleSearch}
                                    disabled={searchLoading}
                                >
                                    {searchLoading ? 'Searching...' : '🔍 Search'}
                                </button>
                                {isSearching && (
                                    <button
                                        className="btn btn-reset"
                                        onClick={handleResetSearch}
                                    >
                                        Show All
                                    </button>
                                )}
                            </div>
                            {searchError && (
                                <p className="search-error">{searchError}</p>
                            )}
                            {isSearching && (
                                <p className="search-info">
                                    Showing {todos.length} result{todos.length !== 1 ? 's' : ''} for "{searchTerm}"
                                </p>
                            )}
                        </div>

                        {loading ? (
                            <p className="loading">Loading todos...</p>
                        ) : todos.length === 0 ? (
                            <div className="empty">
                                {isSearching ? (
                                    <>
                                        <p>No todos found for "{searchTerm}"</p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleResetSearch}
                                        >
                                            Show All Todos
                                        </button>
                                    </>
                                ) : (
                                    <p>No todos yet. Add one to get started!</p>
                                )}
                            </div>
                        ) : (
                            <div className="todos-list">
                                {todos.map(todo => {
                                    const progress = calculateProgress(todo.id);
                                    const isExpanded = expandedTodoId === todo.id;

                                    return (
                                        <div key={todo.id} className={`todo-card ${todo.isCompleted ? 'completed' : ''}`}>
                                            <div className="todo-main">
                                                <div className="todo-content">
                                                    <h3>{todo.title}</h3>
                                                    {todo.description && <p className="description">{todo.description}</p>}
                                                    {todo.dueDate && (
                                                        <p className="due-date">
                                                            📅 Due: {new Date(todo.dueDate).toLocaleString()}
                                                        </p>
                                                    )}
                                                    <p className="status">
                                                        Status: {todo.isCompleted ? '✅ Completed' : '⏳ Pending'}
                                                    </p>

                                                    {/* Progress Bar */}
                                                    {progress && (
                                                        <div className="subtask-progress">
                                                            <div className="progress-text">
                                                                {progress.completed}/{progress.total} subtasks completed
                                                            </div>
                                                            <div className="progress-bar">
                                                                <div
                                                                    className="progress-fill"
                                                                    style={{ width: `${progress.percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="todo-actions">
                                                    {isAuthenticated && (
                                                        <button
                                                            className="btn btn-subtasks"
                                                            onClick={() => toggleSubtaskExpand(todo.id)}
                                                        >
                                                            {isExpanded ? '▼ Hide' : '▶ Subtasks'}
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-edit"
                                                        onClick={() => fetchTodoById(todo.id)}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-delete"
                                                        onClick={() => handleDeleteTodo(todo.id)}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Subtasks Section - Only for authenticated users */}
                                            {isAuthenticated && isExpanded && (
                                                <div className="subtasks-container">
                                                    <h4>Subtasks</h4>

                                                    {/* Add Subtask Input */}
                                                    <div className="add-subtask">
                                                        <input
                                                            type="text"
                                                            placeholder="Add a subtask..."
                                                            value={newSubtaskText[todo.id] || ''}
                                                            onChange={(e) => setNewSubtaskText(prev => ({
                                                                ...prev,
                                                                [todo.id]: e.target.value
                                                            }))}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    addSubtask(todo.id);
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            className="btn btn-add-subtask"
                                                            onClick={() => addSubtask(todo.id)}
                                                        >
                                                            + Add
                                                        </button>
                                                    </div>

                                                    {/* Subtask List */}
                                                    <div className="subtasks-list">
                                                        {(subtasks[todo.id] || []).map(subtask => (
                                                            <div key={subtask.id} className="subtask-item">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={subtask.isCompleted}
                                                                    onChange={() => toggleSubtaskCompletion(subtask)}
                                                                />
                                                                <span className={subtask.isCompleted ? 'completed-subtask' : ''}>
                                                                    {subtask.title}
                                                                </span>
                                                                <button
                                                                    className="btn-delete-subtask"
                                                                    onClick={() => deleteSubtask(subtask.id, todo.id)}
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {(!subtasks[todo.id] || subtasks[todo.id].length === 0) && (
                                                            <p className="no-subtasks">No subtasks yet</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {/* Auth Modal */}
            {showAuthModal && (
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={handleCloseAuth}
                    initialMode={authMode}
                />
            )}

            {/* Admin Dashboard */}
            {showAdminDashboard && (
                <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
            )}
        </>
    );
}

export default App;
