import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const autoInsightService = {
  async uploadCSV(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  async getDatasets() {
    const response = await apiClient.get('/datasets/');
    return response.data;
  },

  async getInsights(datasetId) {
    const response = await apiClient.get(`/insights/${datasetId}`);
    return response.data;
  },

  async getFilteredInsights(id, filters) {
    try {
      const resp = await apiClient.post(`/insights/${id}/filter`, { filters });
      return resp.data; // { metrics, charts }
    } catch (err) {
      console.error("Filter error:", err);
      throw err;
    }
  },

  async getDataPreview(datasetId, page = 1, pageSize = 50) {
    const response = await apiClient.get(`/data-preview/${datasetId}`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }
};
