import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import GuestWarning from './components/GuestWarning';
import AdminDashboard from './components/AdminDashboard';
import AttachmentUpload from './components/AttachmentUpload';
import AttachmentList from './components/AttachmentList';
import GoogleCalendarSettings from './components/GoogleCalendarSettings';
import authService from './services/authService';
import './App.css';

const API_URL = 'http://localhost:8080/api/todos';
const SUBTASK_API_URL = 'http://localhost:8080/api/subtasks';
const ATTACHMENT_API_URL = 'http://localhost:8080/api/attachments';
const GOOGLE_API_URL = 'http://localhost:8080/api/calendar'; 

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
    
    const [isCalendarConnected, setIsCalendarConnected] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showSuccessPage, setShowSuccessPage] = useState(false);

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

    // OAuth Success Detector (Checks URL for ?status=success)
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get('status') === 'success') {
            setShowSuccessPage(true);
            window.history.replaceState({}, document.title, "/"); 
            setTimeout(() => setShowSuccessPage(false), 5000); 
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAllTodos();
            checkCalendarStatus();
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

    // Calendar logic
    const checkCalendarStatus = async () => {
        try {
            const response = await apiCall('get', `${GOOGLE_API_URL}/status`);
            setIsCalendarConnected(response.connected);
        } catch (error) {
            console.error('Error checking calendar status:', error);
        }
    };

    const handleConnectCalendar = async () => {
        try {
            const response = await apiCall('get', `${GOOGLE_API_URL}/connect`);
            if (response.authorizationUrl) {
                window.location.href = response.authorizationUrl;
            }
        } catch (error) {
            alert('Failed to initiate Google Calendar connection');
        }
    };

    const fetchAllTodos = async () => {
        try {
            setLoading(true);
            let response;
            if (isAuthenticated) {
                response = await apiCall('get', API_URL);
            } else {
                response = (await axios.get(API_URL)).data;
            }
            setTodos(response);
            setOriginalTodos(response); 
            setIsSearching(false); 
            setSearchTerm(''); 
            setSearchError(''); 
        } catch (error) {
            console.error('Error fetching todos:', error);
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
            } else {
                const filtered = originalTodos.filter(todo =>
                    todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                setTodos(filtered);
            }
            setIsSearching(true);
        } catch (error) {
            setSearchError('Failed to search todos.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleResetSearch = () => {
        if (isAuthenticated) fetchAllTodos();
        else {
            setTodos(originalTodos);
            setIsSearching(false);
            setSearchTerm('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return alert('Please enter a title');
        try {
            const newTodo = { ...formData, dueDate: formData.dueDate ? formData.dueDate : null };
            if (isAuthenticated) {
                const response = await apiCall('post', API_URL, newTodo);
                setTodos(prev => [...prev, response]);
            } else {
                newTodo.id = Date.now();
                setTodos(prev => [...prev, newTodo]);
            }
            resetForm();
            alert('Todo created successfully!');
        } catch (error) {
            alert('Failed to create todo');
        }
    };

    const handleUpdateTodo = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return alert('Please enter a title');
        try {
            const updatedTodo = { ...formData, dueDate: formData.dueDate ? formData.dueDate : null };
            if (isAuthenticated) {
                const response = await apiCall('put', `${API_URL}/${editingId}`, updatedTodo);
                setTodos(todos.map(t => t.id === editingId ? response : t));
            } else {
                setTodos(todos.map(t => t.id === editingId ? { ...t, ...updatedTodo } : t));
            }
            resetForm();
            alert('Todo updated successfully!');
        } catch (error) {
            alert('Failed to update todo');
        }
    };

    const handleDeleteTodo = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                if (isAuthenticated) await apiCall('delete', `${API_URL}/${id}`);
                setTodos(todos.filter(t => t.id !== id));
                alert('Todo deleted!');
            } catch (error) {
                alert('Delete failed');
            }
        }
    };

    const fetchTodoById = async (id) => {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            setFormData({
                title: todo.title,
                description: todo.description || '',
                isCompleted: todo.isCompleted,
                dueDate: todo.dueDate ? todo.dueDate.slice(0, 16) : ''
            });
            setEditingId(id);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', isCompleted: false, dueDate: '' });
        setEditingId(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const toggleTodoExpand = (id) => {
        if (!isAuthenticated) return alert('Registered users only.');
        setExpandedTodoId(expandedTodoId === id ? null : id);
    };

    return (
        <>
            {showSuccessPage && (
                <div className="calendar-success-overlay">
                    <div className="success-card">
                        <span className="success-icon">🚀</span>
                        <h1>Successfully Connected!</h1>
                        <p>Your tasks are now syncing with Google Calendar.</p>
                        <button className="btn btn-primary" onClick={() => setShowSuccessPage(false)}>Awesome!</button>
                    </div>
                </div>
            )}

            <Navbar
                onShowAuth={(mode) => { setAuthMode(mode); setShowAuthModal(true); }}
                onShowAdmin={() => setShowAdminDashboard(true)}
                onShowCalendar={() => setShowCalendarModal(true)}
                isCalendarConnected={isCalendarConnected}
            />

            <div className="app-container">
                <header className="header">
                    <h1>📝 My Todo Application</h1>
                    <p>Manage your tasks efficiently with subtasks and attachments</p>
                </header>

                <main className="main-content">
                    {!isAuthenticated && (
                        <GuestWarning onShowAuth={(mode) => { setAuthMode(mode); setShowAuthModal(true); }} />
                    )}

                    <section className="form-section">
                        <h2>{editingId ? 'Edit Todo' : 'Add New Todo'}</h2>
                        <form onSubmit={editingId ? handleUpdateTodo : handleAddTodo} className="form">
                            <div className="form-group">
                                <label htmlFor="title">Title *</label>
                                <input id="title" type="text" name="title" placeholder="Enter todo title" value={formData.title} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea id="description" name="description" placeholder="Enter todo description" value={formData.description} onChange={handleInputChange} rows="3" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="dueDate">Due Date</label>
                                <input id="dueDate" type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleInputChange} />
                            </div>
                            <div className="form-group checkbox">
                                <label htmlFor="isCompleted">
                                    <input id="isCompleted" type="checkbox" name="isCompleted" checked={formData.isCompleted} onChange={handleInputChange} />
                                    Mark as completed
                                </label>
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="btn btn-primary">{editingId ? 'Update Todo' : 'Add Todo'}</button>
                                {editingId && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
                            </div>
                        </form>
                    </section>

                    <section className="todos-section">
                        <h2>Your Todos</h2>
                        <div className="search-section">
                            <div className="search-input-group">
                                <input type="text" placeholder="Search todos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="search-input" />
                                <button className="btn btn-search" onClick={handleSearch} disabled={searchLoading}>{searchLoading ? 'Searching...' : '🔍 Search'}</button>
                                {isSearching && <button className="btn btn-reset" onClick={handleResetSearch}>Show All</button>}
                            </div>
                        </div>

                        {loading ? <p className="loading">Loading todos...</p> : (
                            <div className="todos-list">
                                {todos.map(todo => (
                                    <div key={todo.id} className={`todo-card ${todo.isCompleted ? 'completed' : ''}`}>
                                        <div className="todo-main">
                                            <div className="todo-content">
                                                <h3>
                                                    {todo.title}
                                                    {isAuthenticated && isCalendarConnected && (
                                                        <span className="sync-status" title={todo.googleCalendarEventId ? "Synced" : "Pending"}>
                                                            {todo.googleCalendarEventId ? ' 📅✅' : ' 📅⏳'}
                                                        </span>
                                                    )}
                                                </h3>
                                                {todo.description && <p className="description">{todo.description}</p>}
                                                {todo.dueDate && <p className="due-date">📅 Due: {new Date(todo.dueDate).toLocaleString()}</p>}
                                            </div>
                                            <div className="todo-actions">
                                                <button className="btn btn-edit" onClick={() => fetchTodoById(todo.id)}>✏️ Edit</button>
                                                <button className="btn btn-delete" onClick={() => handleDeleteTodo(todo.id)}>🗑️ Delete</button>
                                                {isAuthenticated && <button className="btn btn-details" onClick={() => toggleTodoExpand(todo.id)}>{expandedTodoId === todo.id ? 'Hide' : 'Details'}</button>}
                                            </div>
                                        </div>
                                        {expandedTodoId === todo.id && (
                                            <div className="expanded-features">
                                                <AttachmentUpload todoId={todo.id} onUpload={() => {}} />
                                                <AttachmentList attachments={attachments[todo.id] || []} todoId={todo.id} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>

            <GoogleCalendarSettings isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} isConnected={isCalendarConnected} onConnect={handleConnectCalendar} />
            {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authMode} />}
            {showAdminDashboard && <AdminDashboard onClose={() => setShowAdminDashboard(false)} />}
        </>
    );
}

export default App;
