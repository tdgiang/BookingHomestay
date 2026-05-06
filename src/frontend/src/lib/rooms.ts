import api from './api';

export interface Room {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  area: number | null;
  floor: number | null;
  amenities: string[];
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomsResponse {
  items: Room[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateRoomPayload {
  name: string;
  description?: string;
  capacity: number;
  area?: number;
  floor?: number;
  amenities?: string[];
  isActive?: boolean;
}

export const roomsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ data: RoomsResponse }>('/admin/rooms', { params }).then((r) => r.data.data),

  get: (id: string) =>
    api.get<{ data: Room }>(`/admin/rooms/${id}`).then((r) => r.data.data),

  create: (payload: CreateRoomPayload) =>
    api.post<{ data: Room }>('/admin/rooms', payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<CreateRoomPayload>) =>
    api.patch<{ data: Room }>(`/admin/rooms/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) =>
    api.delete(`/admin/rooms/${id}`),

  uploadImages: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api.post<{ data: Room }>(`/admin/rooms/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },

  removeImage: (id: string, imageUrl: string) =>
    api.delete<{ data: Room }>(`/admin/rooms/${id}/images`, { data: { imageUrl } }).then((r) => r.data.data),
};
