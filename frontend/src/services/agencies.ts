import { api } from './api';

export interface Agency {
  id: string;
  name: string;
  contact_email?: string;
  status: 'active' | 'inactive';
  config?: any;
  created_at: string;
}

export const agencyService = {
  getAll: async (page = 1, limit = 20) => {
    const response = await api.get(`/api/v1/admin/agencies?page=${page}&limit=${limit}`);
    return response.data;
  },

  create: async (data: Partial<Agency>) => {
    const response = await api.post('/api/v1/admin/agencies', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Agency>) => {
    const response = await api.put(`/api/v1/admin/agencies/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/v1/admin/agencies/${id}`);
    return response.data;
  },

  getStats: async (id: string) => {
    const response = await api.get(`/api/v1/admin/agencies/${id}/analytics`);
    return response.data;
  }
};
