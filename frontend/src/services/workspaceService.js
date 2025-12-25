import api from './api';

export const workspaceService = {
    getDocuments: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/documents`);
        return response.data;
    },

    uploadDocuments: async (projectId, files) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        // axios handles multipart/form-data content-type automatically when data is FormData
        // axios handles multipart/form-data content-type automatically when data is FormData
        // but since we set default json header, we should override it to be safe
        // axios handles multipart/form-data content-type automatically when data is FormData
        // but since we set default json header, we should override it to be safe
        const response = await api.post(`/projects/${projectId}/documents/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    deleteDocument: async (projectId, documentId) => {
        await api.delete(`/projects/${projectId}/documents/${documentId}`);
    },

    chat: async (projectId, query, documentIds = []) => {
        const response = await api.post(`/projects/${projectId}/query/chat`, {
            query,
            document_ids: documentIds
        });
        return response.data;
    },

    async getMessages(projectId, type = 'chat') {
        const response = await api.get(`/projects/${projectId}/messages`, { params: { type } });
        return response.data;
    },

    deepResearch: async (projectId, query) => {
        const response = await api.post(`/projects/${projectId}/query/research`, { query });
        return response.data;
    },

    analyze: async (projectId) => {
        const response = await api.post(`/projects/${projectId}/query/analyze`);
        return response.data;
    }
};
