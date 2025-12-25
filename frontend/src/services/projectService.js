import api from './api';

export const projectService = {
    getAll: async () => {
        const response = await api.get('/projects/');
        return response.data;
    },

    create: async (title, description) => {
        const response = await api.post('/projects/', { title, description });
        return response.data;
    },

    getOne: async (id) => {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    }
};
