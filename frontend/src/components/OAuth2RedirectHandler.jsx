import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const OAuth2RedirectHandler = () => {
    const { setAuthToken } = useAuth();
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleOAuth2Redirect = async () => {
            // Extract token and error from URL query parameters
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            const errorParam = params.get('error');

            if (errorParam) {
                // Handle error from OAuth provider
                setError(errorParam || 'OAuth login failed');
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
                return;
            }

            if (token) {
                try {
                    // Save the token using AuthContext
                    await setAuthToken(token);
                    
                    // Redirect to home page
                    window.location.href = '/';
                } catch (err) {
                    setError('Failed to complete login. Please try again.');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                }
            } else {
                // If no token, redirect to home with error
                setError('No authentication token received. Please try again.');
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            }
        };

        handleOAuth2Redirect();
    }, [setAuthToken]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem'
        }}>
            {error ? (
                <>
                    <div style={{
                        fontSize: '3rem',
                        color: '#e74c3c'
                    }}>❌</div>
                    <h2 style={{
                        color: '#e74c3c',
                        margin: 0
                    }}>Login Failed</h2>
                    <p style={{
                        color: '#666',
                        textAlign: 'center',
                        maxWidth: '400px'
                    }}>{error}</p>
                    <p style={{ color: '#999', fontSize: '0.9rem' }}>Redirecting to home page...</p>
                </>
            ) : (
                <>
                    <div style={{
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p>Completing login...</p>
                </>
            )}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default OAuth2RedirectHandler;
