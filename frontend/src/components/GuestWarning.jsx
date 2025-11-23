import React from 'react';
import './GuestWarning.css';

const GuestWarning = ({ onShowAuth }) => {
    return (
        <div className="guest-warning">
            <div className="guest-warning-content">
                <div className="warning-icon">⚠️</div>
                <div className="warning-text">
                    <h3>Guest Mode - Data Not Saved Permanently</h3>
                    <p>
                        You are currently using the app as a guest. Your todos are stored in your browser's
                        session storage and will be lost when you close this tab or browser.
                    </p>
                    <p>
                        <strong>Please note:</strong> Subtasks feature is only available for registered users.
                    </p>
                </div>
                <button
                    className="warning-register-btn"
                    onClick={() => onShowAuth('register')}
                >
                    Register to Save Your Data
                </button>
            </div>
        </div>
    );
};

export default GuestWarning;