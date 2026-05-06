import axios, { AxiosError } from 'axios';
import { getSession } from 'next-auth/react';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status ?? 500;
    const message = error.response?.data?.message ?? error.message;
    throw new ApiError(status, message, error.response?.data);
  },
);

export default api;

/** Server-side api call with explicit token (use in Server Components / Route Handlers). */
export function serverApi(accessToken?: string) {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}
