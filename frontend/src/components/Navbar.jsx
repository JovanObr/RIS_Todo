import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar({ onShowAuth, onShowAdmin, onShowCalendar, isCalendarConnected }) {
    const { user, isAuthenticated, logout, isAdmin } = useAuth();

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand">
                    <h1>📝 Todo App</h1>
                </div>

                <div className="navbar-menu">
                    {isAuthenticated && (
                        <button 
                            className={`navbar-btn ${isCalendarConnected ? 'btn-cal-connected' : 'btn-cal-disconnected'}`}
                            onClick={onShowCalendar}
                            title="Google Calendar Settings"
                        >
                            {isCalendarConnected ? '📅 ✅' : '📅 ❌'}
                        </button>
                    )}

                    {isAuthenticated ? (
                        <>
                            <span className="navbar-user">
                                {user?.profilePictureUrl ? (
                                    <img 
                                        src={user.profilePictureUrl} 
                                        alt={user.username}
                                        className="navbar-profile-pic"
                                        onError={(e) => { 
                                            e.target.style.display = 'none'; 
                                            const emojiSpan = e.target.parentElement.querySelector('.profile-emoji');
                                            if (emojiSpan) emojiSpan.style.display = 'inline';
                                        }}
                                    />
                                ) : null}
                                <span className="profile-emoji" style={{ display: user?.profilePictureUrl ? 'none' : 'inline' }}>👤</span>
                                {' '}{user?.username}
                                {isAdmin() && <span className="admin-badge">ADMIN</span>}
                            </span>

                            {isAdmin() && (
                                <button className="navbar-btn btn-admin" onClick={onShowAdmin}>
                                    📊 Dashboard
                                </button>
                            )}

                            <button className="navbar-btn btn-logout" onClick={logout}>
                                🚪 Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="navbar-btn btn-login" onClick={() => onShowAuth('login')}>
                                🔐 Login
                            </button>
                            <button className="navbar-btn btn-register" onClick={() => onShowAuth('register')}>
                                📝 Register
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
