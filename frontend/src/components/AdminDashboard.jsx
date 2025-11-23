import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const API_URL = 'http://localhost:8080/api/admin';

const AdminDashboard = ({ onClose }) => {
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [allTodos, setAllTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stats');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, activityRes, todosRes] = await Promise.all([
                axios.get(`${API_URL}/stats`),
                axios.get(`${API_URL}/activity/recent`),
                axios.get(`${API_URL}/todos`)
            ]);

            setStats(statsRes.data);
            setRecentActivity(activityRes.data);
            setAllTodos(todosRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            alert('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTodo = async (id) => {
        if (window.confirm('Are you sure you want to delete this todo (Admin action)?')) {
            try {
                await axios.delete(`${API_URL}/todos/${id}`);
                alert('Todo deleted successfully!');
                fetchDashboardData();
            } catch (error) {
                console.error('Error deleting todo:', error);
                alert('Failed to delete todo');
            }
        }
    };

    if (loading) {
        return (
            <div className="admin-modal-overlay">
                <div className="admin-modal">
                    <div className="loading-spinner">Loading dashboard...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <button className="admin-modal-close" onClick={onClose}>×</button>

                <div className="admin-header">
                    <h2>📊 Admin Dashboard</h2>
                    <p>Overview of application statistics and user activity</p>
                </div>

                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        📈 Statistics
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'activity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        🕒 Recent Activity
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'todos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('todos')}
                    >
                        📋 All Todos
                    </button>
                </div>

                <div className="admin-content">
                    {activeTab === 'stats' && stats && (
                        <div className="stats-grid">
                            <div className="stat-card stat-primary">
                                <div className="stat-icon">👥</div>
                                <div className="stat-info">
                                    <h3>{stats.totalUsers}</h3>
                                    <p>Total Users</p>
                                    <small>{stats.regularUsers} regular, {stats.adminUsers} admin</small>
                                </div>
                            </div>

                            <div className="stat-card stat-success">
                                <div className="stat-icon">📝</div>
                                <div className="stat-info">
                                    <h3>{stats.totalTodos}</h3>
                                    <p>Total Todos</p>
                                    <small>{stats.avgTodosPerUser.toFixed(1)} per user</small>
                                </div>
                            </div>

                            <div className="stat-card stat-warning">
                                <div className="stat-icon">✅</div>
                                <div className="stat-info">
                                    <h3>{stats.completedTodos}</h3>
                                    <p>Completed Todos</p>
                                    <small>{stats.completionRate.toFixed(1)}% completion rate</small>
                                </div>
                            </div>

                            <div className="stat-card stat-danger">
                                <div className="stat-icon">⏳</div>
                                <div className="stat-info">
                                    <h3>{stats.pendingTodos}</h3>
                                    <p>Pending Todos</p>
                                    <small>{stats.totalTodos > 0 ? ((stats.pendingTodos / stats.totalTodos) * 100).toFixed(1) : 0}% of total</small>
                                </div>
                            </div>

                            <div className="stat-card stat-info">
                                <div className="stat-icon">📋</div>
                                <div className="stat-info">
                                    <h3>{stats.totalSubtasks}</h3>
                                    <p>Total Subtasks</p>
                                    <small>{stats.completedSubtasks} completed</small>
                                </div>
                            </div>

                            <div className="stat-card stat-info">
                                <div className="stat-icon">⏱️</div>
                                <div className="stat-info">
                                    <h3>{stats.pendingSubtasks}</h3>
                                    <p>Pending Subtasks</p>
                                    <small>{stats.totalSubtasks > 0 ? ((stats.pendingSubtasks / stats.totalSubtasks) * 100).toFixed(1) : 0}% pending</small>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="activity-list">
                            <h3>Recent Activity (Last 10 Todos)</h3>
                            {recentActivity.length === 0 ? (
                                <p className="empty-state">No recent activity</p>
                            ) : (
                                <div className="activity-items">
                                    {recentActivity.map(todo => (
                                        <div key={todo.id} className="activity-item">
                                            <div className="activity-icon">
                                                {todo.isCompleted ? '✅' : '📝'}
                                            </div>
                                            <div className="activity-details">
                                                <h4>{todo.title}</h4>
                                                <p>
                                                    User: {todo.user?.username || 'Unknown'} |
                                                    Created: {new Date(todo.createdAt).toLocaleString()}
                                                </p>
                                                {todo.description && (
                                                    <p className="activity-desc">{todo.description}</p>
                                                )}
                                            </div>
                                            <div className="activity-status">
                                                {todo.isCompleted ? (
                                                    <span className="status-completed">Completed</span>
                                                ) : (
                                                    <span className="status-pending">Pending</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'todos' && (
                        <div className="todos-management">
                            <h3>All Todos Management ({allTodos.length})</h3>
                            {allTodos.length === 0 ? (
                                <p className="empty-state">No todos found</p>
                            ) : (
                                <div className="admin-todos-list">
                                    {allTodos.map(todo => (
                                        <div key={todo.id} className={`admin-todo-card ${todo.isCompleted ? 'completed' : ''}`}>
                                            <div className="admin-todo-header">
                                                <h4>{todo.title}</h4>
                                                <button
                                                    className="admin-delete-btn"
                                                    onClick={() => handleDeleteTodo(todo.id)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>

                                            {todo.description && (
                                                <p className="admin-todo-desc">{todo.description}</p>
                                            )}

                                            <div className="admin-todo-meta">
                                                <span>👤 User: {todo.user?.username || 'Unknown'}</span>
                                                <span>
                                                    {todo.isCompleted ? '✅ Completed' : '⏳ Pending'}
                                                </span>
                                                {todo.dueDate && (
                                                    <span>📅 Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
                                                )}
                                            </div>

                                            <div className="admin-todo-dates">
                                                <small>Created: {new Date(todo.createdAt).toLocaleString()}</small>
                                                {todo.updatedAt && (
                                                    <small>Updated: {new Date(todo.updatedAt).toLocaleString()}</small>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;