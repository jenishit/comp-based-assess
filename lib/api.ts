import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For JWT cookies later
});

export const logService = {
  sendBatch: async (sessionId: string, batch: any) => {
    const response = await apiClient.post(`/api/v1/logs/${sessionId}`, batch);
    return response.data;
  },
  sendFocusEvent: async (sessionId: string, payload: any) => {
    const response = await apiClient.post(`/api/v1/logs/${sessionId}/focus`, payload);
    return response.data;
  },
  terminateSession: async (sessionId: string, reason: string) => {
    const response = await apiClient.post(`/api/v1/logs/${sessionId}/terminate`, { reason });
    return response.data;
  },
};

export default apiClient;