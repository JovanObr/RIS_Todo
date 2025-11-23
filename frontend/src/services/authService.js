import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    // Register new user
    async register(username, password, email) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                username,
                password,
                email
            });

            if (response.data.token) {
                this.setAuthData(response.data.token, response.data);
            }

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Registration failed');
        }
    }

    // Login user
    async login(username, password) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                username,
                password
            });

            if (response.data.token) {
                this.setAuthData(response.data.token, response.data);
            }

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || 'Login failed');
        }
    }

    // Logout user
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
    }

    // Set authentication data
    setAuthData(token, userData) {
        this.token = token;
        this.user = userData;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        // Set default axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Check if user is admin
    isAdmin() {
        return this.user?.role === 'ADMIN' || this.user?.roles?.includes('ROLE_ADMIN');
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get token
    getToken() {
        return this.token;
    }

    // Validate token
    async validateToken() {
        if (!this.token) return false;

        try {
            await axios.get(`${API_BASE_URL}/auth/validate`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    // Initialize axios interceptor
    initializeAxiosInterceptor() {
        // Request interceptor
        axios.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers['Authorization'] = `Bearer ${this.token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.logout();
                    window.location.href = '/';
                }
                return Promise.reject(error);
            }
        );
    }
}

const authService = new AuthService();
authService.initializeAxiosInterceptor();

export default authService;