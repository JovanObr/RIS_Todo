import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../App.css"

const CalendarSuccess = () => {
    const navigate = useNavigate();
    useEffect(() => {
        const timer = setTimeout(() => navigate('/'), 3000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="success-screen">
            <div className="success-box">
                <h1>✅ Success!</h1>
                <p>Calendar connected. Returning to app...</p>
            </div>
        </div>
    );
};
export default CalendarSuccess;
