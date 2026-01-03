import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import GuestWarning from './components/GuestWarning';
import AdminDashboard from './components/AdminDashboard';
import AttachmentUpload from './components/AttachmentUpload';
import AttachmentList from './components/AttachmentList';
import authService from './services/authService';
import './App.css';

const API_URL = 'http://localhost:8080/api/todos';
const SUBTASK_API_URL = 'http://localhost:8080/api/subtasks';
const ATTACHMENT_API_URL = 'http://localhost:8080/api/attachments';

function App() {
    const { isAuthenticated } = useAuth();
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expandedTodoId, setExpandedTodoId] = useState(null);
    const [subtasks, setSubtasks] = useState({});
    const [attachments, setAttachments] = useState({});
    const [newSubtaskText, setNewSubtaskText] = useState({});
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [isSearching, setIsSearching] = useState(false); 
    const [originalTodos, setOriginalTodos] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [expandedSections, setExpandedSections] = useState({});
    const [uploadingAttachment, setUploadingAttachment] = useState({});
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        isCompleted: false,
        dueDate: ''
    });

    // Helper function to make API calls with auth headers
    const apiCall = async (method, url, data = null, config = {}) => {
        const token = authService.getToken();
        const headers = {
            'Authorization': `Bearer ${token}`,
            ...config.headers
        };

        try {
            const response = await axios({
                method,
                url,
                data,
                headers
            });
            return response.data;
        } catch (error) {
            console.error(`API Error (${method} ${url}):`, error);
            throw error;
        }
    };

    // Helper function for file uploads
    const apiUpload = async (url, formData) => {
        const token = authService.getToken();
        
        try {
            const response = await axios.post(url, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Upload Error (${url}):`, error);
            throw error;
        }
    };

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
            let response;
            
            if (isAuthenticated) {
                response = await apiCall('get', API_URL);
            } else {
                // Guest mode - no auth header needed
                response = await axios.get(API_URL);
            }
            
            setTodos(response);
            setOriginalTodos(response); 
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
                const response = await apiCall('get', `${API_URL}?name=${encodeURIComponent(searchTerm.trim())}`);
                setTodos(response);
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
            const response = await apiCall('get', `${API_URL}/${id}`);
            setFormData({
                title: response.title,
                description: response.description,
                isCompleted: response.isCompleted,
                dueDate: response.dueDate ? response.dueDate.slice(0, 16) : ''
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
            const response = await apiCall('get', `${SUBTASK_API_URL}/todo/${todoId}`);
            setSubtasks(prev => ({ ...prev, [todoId]: response }));
        } catch (error) {
            console.error('Error fetching subtasks:', error);
        }
    };

    // ATTACHMENT FUNCTIONS (only for authenticated users)
    const fetchAttachments = async (todoId) => {
        if (!isAuthenticated) return;

        try {
            const response = await apiCall('get', `${ATTACHMENT_API_URL}/todo/${todoId}`);
            setAttachments(prev => ({ ...prev, [todoId]: response }));
        } catch (error) {
            console.error('Error fetching attachments:', error);
        }
    };

    const toggleTodoExpand = (todoId) => {
        if (!isAuthenticated) {
            alert('Advanced features are only available for registered users. Please login or register.');
            return;
        }

        if (expandedTodoId === todoId) {
            setExpandedTodoId(null);
            setExpandedSections(prev => ({ ...prev, [todoId]: { subtasks: false, attachments: false } }));
        } else {
            setExpandedTodoId(todoId);
            setExpandedSections(prev => ({ 
                ...prev, 
                [todoId]: { subtasks: false, attachments: false } 
            }));
        }
    };

    const toggleSection = (todoId, section) => {
        setExpandedSections(prev => ({
            ...prev,
            [todoId]: {
                ...prev[todoId],
                [section]: !prev[todoId]?.[section]
            }
        }));

        // Fetch data when section is expanded
        if (!expandedSections[todoId]?.[section]) {
            if (section === 'subtasks' && !subtasks[todoId]) {
                fetchSubtasks(todoId);
            }
            if (section === 'attachments' && !attachments[todoId]) {
                fetchAttachments(todoId);
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

            await apiCall('post', SUBTASK_API_URL, newSubtask);
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
            await apiCall('put', `${SUBTASK_API_URL}/${subtask.id}`, updated);
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
                await apiCall('delete', `${SUBTASK_API_URL}/${subtaskId}`);
                fetchSubtasks(todoId);
            } catch (error) {
                console.error('Error deleting subtask:', error);
                alert('Failed to delete subtask');
            }
        }
    };

    // ATTACHMENT HANDLERS
    const handleUploadAttachment = async (todoId, file) => {
        if (!isAuthenticated) return;

        setUploadingAttachment(prev => ({ ...prev, [todoId]: true }));

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('todoId', todoId);

            // Use the apiUpload helper which adds auth headers
            const response = await apiUpload(ATTACHMENT_API_URL, formData);

            // Refresh attachments list
            fetchAttachments(todoId);
            return response;
        } catch (error) {
            console.error('Error uploading attachment:', error);
            alert('Failed to upload attachment');
            throw error;
        } finally {
            setUploadingAttachment(prev => ({ ...prev, [todoId]: false }));
        }
    };

    const handleDeleteAttachment = async (attachmentId, todoId) => {
        if (!isAuthenticated) return;

        if (window.confirm('Delete this attachment?')) {
            try {
                await apiCall('delete', `${ATTACHMENT_API_URL}/${attachmentId}`);
                fetchAttachments(todoId);
            } catch (error) {
                console.error('Error deleting attachment:', error);
                alert('Failed to delete attachment');
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
                const response = await apiCall('post', API_URL, newTodo);
                const updatedTodos = [...todos, response];
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
                const response = await apiCall('put', `${API_URL}/${editingId}`, updatedTodo);
                const updatedTodos = todos.map(todo =>
                    todo.id === editingId ? response : todo
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
                    await apiCall('delete', `${API_URL}/${id}`);
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

    // Get attachment count for a todo
    const getAttachmentCount = (todoId) => {
        return attachments[todoId]?.length || 0;
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
                    <p>Manage your tasks efficiently with subtasks and attachments</p>
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
                                    const attachmentCount = getAttachmentCount(todo.id);

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
                                                        <>
                                                            <button
                                                                className="btn btn-subtasks"
                                                                onClick={() => toggleTodoExpand(todo.id)}
                                                            >
                                                                {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                                                            </button>
                                                        </>
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

                                            {/* Advanced Features Section - Only for authenticated users */}
                                            {isAuthenticated && isExpanded && (
                                                <div className="advanced-features-container">
                                                    {/* Subtasks Section */}
                                                    <div className="feature-section">
                                                        <button 
                                                            className="feature-header"
                                                            onClick={() => toggleSection(todo.id, 'subtasks')}
                                                        >
                                                            <span>📋 Subtasks</span>
                                                            <span className="feature-toggle">
                                                                {expandedSections[todo.id]?.subtasks ? '▲' : '▼'}
                                                            </span>
                                                        </button>
                                                        
                                                        {expandedSections[todo.id]?.subtasks && (
                                                            <div className="subtasks-container">
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

                                                    {/* Attachments Section */}
                                                    <div className="feature-section">
                                                        <button 
                                                            className="feature-header"
                                                            onClick={() => toggleSection(todo.id, 'attachments')}
                                                        >
                                                            <span>
                                                                📎 Attachments 
                                                                {attachmentCount > 0 && (
                                                                    <span className="attachment-count-badge">
                                                                        {attachmentCount}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="feature-toggle">
                                                                {expandedSections[todo.id]?.attachments ? '▲' : '▼'}
                                                            </span>
                                                        </button>
                                                        
                                                        {expandedSections[todo.id]?.attachments && (
                                                            <div className="attachments-container">
                                                                {/* Attachment Upload Component */}
                                                                <AttachmentUpload
                                                                    todoId={todo.id}
                                                                    onUpload={handleUploadAttachment}
                                                                    isUploading={uploadingAttachment[todo.id] || false}
                                                                />

                                                                {/* Attachment List Component */}
                                                                <AttachmentList
                                                                    attachments={attachments[todo.id] || []}
                                                                    onDelete={handleDeleteAttachment}
                                                                    todoId={todo.id}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Attachment Count Badge on Todo Card */}
                                            {isAuthenticated && attachmentCount > 0 && (
                                                <div className="attachment-badge">
                                                    📎 {attachmentCount}
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
