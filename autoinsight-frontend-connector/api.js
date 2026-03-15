/**
 * autoinsight-api.js
 * Drop this file into you React app (e.g., in src/services/ or src/api/)
 * Usage requires axios: `npm install axios`
 */

import axios from 'axios';

// Fast API default port
const API_BASE_URL = 'http://localhost:8000'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const autoInsightService = {
  
  /**
   * Uploads a CSV file to be processed into an insight dashboard
   * @param {File} file - The CSV file from an <input type="file" />
   * @param {Function} onProgress - Optional callback for upload progress (0-100)
   * @returns {Promise<Object>} The dataset metadata object including the generated `id`
   */
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

  /**
   * Fetch all previously uploaded datasets
   * @returns {Promise<Array>} List of dataset metadata objects
   */
  async getDatasets() {
    const response = await apiClient.get('/datasets/');
    return response.data;
  },

  /**
   * Fetch the calculated metrics and chart data for a given dataset ID
   * @param {string} datasetId - The UUID of the dataset
   * @returns {Promise<Object>} { metrics, volume_flux, market_share }
   */
  async getInsights(datasetId) {
    const response = await apiClient.get(`/insights/${datasetId}`);
    return response.data;
  },

  /**
   * (Optional) Fetch paginated raw data rows to display in a table
   * @param {string} datasetId - The UUID of the dataset
   * @param {number} page - Page number (1-indexed)
   * @param {number} pageSize - Number of rows per page
   * @returns {Promise<Object>} { columns, data, total_rows, page, page_size }
   */
  async getDataPreview(datasetId, page = 1, pageSize = 50) {
    const response = await apiClient.get(`/data-preview/${datasetId}`, {
      params: { page, page_size },
    });
    return response.data;
  }
};
