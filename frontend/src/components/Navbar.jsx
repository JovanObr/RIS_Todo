import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar({ onShowAuth, onShowAdmin }) {
    const { user, isAuthenticated, logout, isAdmin } = useAuth();

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand">
                    <h1>📝 Todo App</h1>
                </div>

                <div className="navbar-menu">
                    {isAuthenticated ? (
                        <>
                            <span className="navbar-user">
                                👤 {user?.username}
                                {isAdmin() && <span className="admin-badge">ADMIN</span>}
                            </span>

                            {isAdmin() && (
                                <button
                                    className="navbar-btn btn-admin"
                                    onClick={onShowAdmin}
                                >
                                    📊 Dashboard
                                </button>
                            )}

                            <button
                                className="navbar-btn btn-logout"
                                onClick={logout}
                            >
                                🚪 Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="navbar-btn btn-login"
                                onClick={() => onShowAuth('login')}
                            >
                                🔐 Login
                            </button>
                            <button
                                className="navbar-btn btn-register"
                                onClick={() => onShowAuth('register')}
                            >
                                📝 Register
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;