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
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler';
import authService from './services/authService';
import './App.css';

const API_URL = 'http://localhost:8080/api/todos';
const SUBTASK_API_URL = 'http://localhost:8080/api/subtasks';
const ATTACHMENT_API_URL = 'http://localhost:8080/api/attachments';
const GOOGLE_API_URL = 'http://localhost:8080/calendar';

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
    
    // Google Calendar State
    const [isCalendarConnected, setIsCalendarConnected] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showSuccessPage, setShowSuccessPage] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        isCompleted: false,
        dueDate: ''
    });

    const apiCall = async (method, url, data = null, config = {}) => {
        const token = authService.getToken();
        const headers = {
            'Authorization': `Bearer ${token}`,
            ...config.headers
        };
        try {
            const response = await axios({ method, url, data, headers });
            return response.data;
        } catch (error) {
            console.error(`API Error (${method} ${url}):`, error);
            throw error;
        }
    };

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

    // OAuth Success Detector
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

    const checkCalendarStatus = async () => {
        try {
            const response = await apiCall('get', `${GOOGLE_API_URL}/status`);
            setIsCalendarConnected(response.connected);
        } catch (error) { console.error('Calendar error'); }
    };

    const handleConnectCalendar = async () => {
        try {
            const response = await apiCall('get', `${GOOGLE_API_URL}/connect`);
            if (response.authorizationUrl) window.location.href = response.authorizationUrl;
        } catch (error) { alert('Auth failed'); }
    };

    const fetchAllTodos = async () => {
        try {
            setLoading(true);
            const response = isAuthenticated ? await apiCall('get', API_URL) : (await axios.get(API_URL)).data;
            setTodos(response);
            setOriginalTodos(response); 
            setIsSearching(false); 
            setSearchTerm(''); 
        } catch (error) { console.error('Fetch error'); } finally { setLoading(false); }
    };

    // --- SUBTASK LOGIC (Same as old code) ---
    const fetchSubtasks = async (todoId) => {
        if (!isAuthenticated) return;
        try {
            const response = await apiCall('get', `${SUBTASK_API_URL}/todo/${todoId}`);
            setSubtasks(prev => ({ ...prev, [todoId]: response }));
        } catch (error) { console.error('Error fetching subtasks'); }
    };

    const addSubtask = async (todoId) => {
        if (!isAuthenticated) return;
        const text = newSubtaskText[todoId];
        if (!text || !text.trim()) { alert('Please enter subtask text'); return; }
        try {
            const newSubtask = { todoId: todoId, title: text.trim(), isCompleted: false, position: subtasks[todoId] ? subtasks[todoId].length : 0 };
            await apiCall('post', SUBTASK_API_URL, newSubtask);
            setNewSubtaskText(prev => ({ ...prev, [todoId]: '' }));
            fetchSubtasks(todoId);
        } catch (error) { alert('Failed to add subtask'); }
    };

    const toggleSubtaskCompletion = async (subtask) => {
        if (!isAuthenticated) return;
        try {
            const updated = { ...subtask, isCompleted: !subtask.isCompleted };
            await apiCall('put', `${SUBTASK_API_URL}/${subtask.id}`, updated);
            fetchSubtasks(subtask.todoId);
        } catch (error) { alert('Failed to update subtask'); }
    };

    const deleteSubtask = async (subtaskId, todoId) => {
        if (!isAuthenticated) return;
        if (window.confirm('Delete this subtask?')) {
            try {
                await apiCall('delete', `${SUBTASK_API_URL}/${subtaskId}`);
                fetchSubtasks(todoId);
            } catch (error) { alert('Failed to delete subtask'); }
        }
    };

    // --- ATTACHMENT LOGIC (Same as old code) ---
    const fetchAttachments = async (todoId) => {
        if (!isAuthenticated) return;
        try {
            const response = await apiCall('get', `${ATTACHMENT_API_URL}/todo/${todoId}`);
            setAttachments(prev => ({ ...prev, [todoId]: response }));
        } catch (error) { console.error('Error fetching attachments'); }
    };

    const handleUploadAttachment = async (todoId, file) => {
        if (!isAuthenticated) return;
        setUploadingAttachment(prev => ({ ...prev, [todoId]: true }));
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('todoId', todoId);
            const response = await apiUpload(ATTACHMENT_API_URL, formData);
            fetchAttachments(todoId);
            return response;
        } catch (error) { alert('Failed to upload'); } finally {
            setUploadingAttachment(prev => ({ ...prev, [todoId]: false }));
        }
    };

    const handleDeleteAttachment = async (attachmentId, todoId) => {
        if (!isAuthenticated) return;
        if (window.confirm('Delete this attachment?')) {
            try {
                await apiCall('delete', `${ATTACHMENT_API_URL}/${attachmentId}`);
                fetchAttachments(todoId);
            } catch (error) { alert('Failed to delete attachment'); }
        }
    };

    const toggleTodoExpand = (todoId) => {
        if (!isAuthenticated) { alert('Advanced features registered users only.'); return; }
        if (expandedTodoId === todoId) {
            setExpandedTodoId(null);
            setExpandedSections(prev => ({ ...prev, [todoId]: { subtasks: false, attachments: false } }));
        } else {
            setExpandedTodoId(todoId);
            setExpandedSections(prev => ({ ...prev, [todoId]: { subtasks: false, attachments: false } }));
        }
    };

    const toggleSection = (todoId, section) => {
        setExpandedSections(prev => ({
            ...prev,
            [todoId]: { ...prev[todoId], [section]: !prev[todoId]?.[section] }
        }));
        if (!expandedSections[todoId]?.[section]) {
            if (section === 'subtasks') fetchSubtasks(todoId);
            if (section === 'attachments') fetchAttachments(todoId);
        }
    };

    const calculateProgress = (todoId) => {
        if (!isAuthenticated) return null;
        const todoSubtasks = subtasks[todoId] || [];
        if (todoSubtasks.length === 0) return null;
        const completed = todoSubtasks.filter(st => st.isCompleted).length;
        const percentage = Math.round((completed / todoSubtasks.length) * 100);
        return { completed, total: todoSubtasks.length, percentage };
    };

    // --- FORM LOGIC ---
    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;
        try {
            const newTodo = { ...formData, dueDate: formData.dueDate || null };
            if (isAuthenticated) {
                const response = await apiCall('post', API_URL, newTodo);
                setTodos([...todos, response]);
            } else {
                newTodo.id = Date.now();
                setTodos([...todos, newTodo]);
            }
            resetForm();
        } catch (e) { alert('Failed to create'); }
    };

    const handleUpdateTodo = async (e) => {
        e.preventDefault();
        try {
            const updatedTodo = { ...formData, dueDate: formData.dueDate || null };
            const response = isAuthenticated ? await apiCall('put', `${API_URL}/${editingId}`, updatedTodo) : { ...updatedTodo, id: editingId };
            setTodos(todos.map(t => t.id === editingId ? response : t));
            resetForm();
        } catch (e) { alert('Update failed'); }
    };

    const handleDeleteTodo = async (id) => {
        if (window.confirm('Delete todo?')) {
            try {
                if (isAuthenticated) await apiCall('delete', `${API_URL}/${id}`);
                setTodos(todos.filter(t => t.id !== id));
            } catch (e) { alert('Delete failed'); }
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const resetForm = () => { setFormData({ title: '', description: '', isCompleted: false, dueDate: '' }); setEditingId(null); };

    // Handle OAuth2 redirect
    if (window.location.pathname === '/oauth2/redirect') {
        return <OAuth2RedirectHandler />;
    }

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
                    {!isAuthenticated && <GuestWarning onShowAuth={(m) => {setAuthMode(m); setShowAuthModal(true);}} />}

                    <section className="form-section">
                        <h2>{editingId ? 'Edit Todo' : 'Add New Todo'}</h2>
                        <form onSubmit={editingId ? handleUpdateTodo : handleAddTodo} className="form">
                            <div className="form-group">
                                <label>Title *</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleInputChange} />
                            </div>
                            <div className="form-group checkbox">
                                <label><input type="checkbox" name="isCompleted" checked={formData.isCompleted} onChange={handleInputChange} /> Mark as completed</label>
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="btn btn-primary">{editingId ? 'Update Todo' : 'Add Todo'}</button>
                                {editingId && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
                            </div>
                        </form>
                    </section>

                    <section className="todos-section">
                        <div className="todos-list">
                            {todos.map(todo => {
                                const progress = calculateProgress(todo.id);
                                const isExpanded = expandedTodoId === todo.id;
                                return (
                                    <div key={todo.id} className={`todo-card ${todo.isCompleted ? 'completed' : ''}`}>
                                        <div className="todo-main">
                                            <div className="todo-content">
                                                <h3>
                                                    {todo.title}
                                                    {isAuthenticated && isCalendarConnected && (
                                                        <span className="sync-status">{todo.googleCalendarEventId ? ' 📅✅' : ' 📅⏳'}</span>
                                                    )}
                                                </h3>
                                                {todo.description && <p className="description">{todo.description}</p>}
                                                {progress && (
                                                    <div className="subtask-progress">
                                                        <div className="progress-text">{progress.completed}/{progress.total} subtasks</div>
                                                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress.percentage}%` }}></div></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="todo-actions">
                                                {isAuthenticated && <button className="btn btn-subtasks" onClick={() => toggleTodoExpand(todo.id)}>{isExpanded ? '▼ Hide Details' : '▶ Show Details'}</button>}
                                                <button className="btn btn-edit" onClick={() => { setEditingId(todo.id); setFormData({...todo, dueDate: todo.dueDate?.slice(0, 16) || ''}); }}>✏️ Edit</button>
                                                <button className="btn btn-delete" onClick={() => handleDeleteTodo(todo.id)}>🗑️ Delete</button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="advanced-features-container">
                                                <div className="feature-section">
                                                    <button className="feature-header" onClick={() => toggleSection(todo.id, 'subtasks')}>
                                                        📋 Subtasks {expandedSections[todo.id]?.subtasks ? '▲' : '▼'}
                                                    </button>
                                                    {expandedSections[todo.id]?.subtasks && (
                                                        <div className="subtasks-container">
                                                            <div className="add-subtask">
                                                                <input type="text" placeholder="Add subtask..." value={newSubtaskText[todo.id] || ''} onChange={(e) => setNewSubtaskText(prev => ({...prev, [todo.id]: e.target.value}))} onKeyPress={(e) => e.key === 'Enter' && addSubtask(todo.id)} />
                                                                <button className="btn btn-add-subtask" onClick={() => addSubtask(todo.id)}>+ Add</button>
                                                            </div>
                                                            <div className="subtasks-list">
                                                                {(subtasks[todo.id] || []).map(st => (
                                                                    <div key={st.id} className="subtask-item">
                                                                        <input type="checkbox" checked={st.isCompleted} onChange={() => toggleSubtaskCompletion(st)} />
                                                                        <span className={st.isCompleted ? 'completed-subtask' : ''}>{st.title}</span>
                                                                        <button className="btn-delete-subtask" onClick={() => deleteSubtask(st.id, todo.id)}>×</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="feature-section">
                                                    <button className="feature-header" onClick={() => toggleSection(todo.id, 'attachments')}>
                                                        📎 Attachments {expandedSections[todo.id]?.attachments ? '▲' : '▼'}
                                                    </button>
                                                    {expandedSections[todo.id]?.attachments && (
                                                        <div className="attachments-container">
                                                            <AttachmentUpload todoId={todo.id} onUpload={handleUploadAttachment} isUploading={uploadingAttachment[todo.id]} />
                                                            <AttachmentList attachments={attachments[todo.id] || []} onDelete={handleDeleteAttachment} todoId={todo.id} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
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
