import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - adds auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handles errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        let message = error.response?.data?.detail || error.message || 'An unexpected error occurred';

        // Handle Pydantic 422 error arrays or other objects
        if (typeof message === 'object') {
            if (Array.isArray(message)) {
                message = message.map(err => err.msg).join(', ');
            } else {
                message = JSON.stringify(message);
            }
        }

        // Dispatch custom event for ToastContext
        window.dispatchEvent(new CustomEvent('api-error', {
            detail: { message }
        }));

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
