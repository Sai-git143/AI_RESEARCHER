import api from './api';

export const authService = {
    login: async (email, password) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        const response = await api.post('/auth/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    },

    register: async (email, password, fullName) => {
        const response = await api.post('/auth/register', {
            email,
            password,
            full_name: fullName,
        });
        return response.data;
    },

    getCurrentUser: async () => {
        // We don't have a /me endpoint yet, let's implement a placeholder or assume valid token implies logged in
        // For now, we will store user info in localStorage on login
        return JSON.parse(localStorage.getItem('user') || '{}');
    }
};
