import React from 'react';
import "../App.css"

const GoogleCalendarSettings = ({ isOpen, onClose, isConnected, onConnect }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content calendar-settings-modal">
                <div className="modal-header">
                    <h2>📅 Google Calendar Settings</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>Status: <strong>{isConnected ? '✅ Connected' : '❌ Not Connected'}</strong></p>
                    
                    {!isConnected ? (
                        <div className="setup-info">
                            <p>Connect your account to automatically sync your Todos with Google Calendar.</p>
                            <button className="btn btn-primary" onClick={onConnect}>
                                Authorize Google Calendar
                            </button>
                        </div>
                    ) : (
                        <div className="connection-info">
                            <p>Your tasks are now syncing with your Google Calendar.</p>
                            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                                Refresh Connection
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoogleCalendarSettings;
