import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';

export interface User {
  id: number;
  name: string;
  email: string;
  // API models role as an enum; tolerate string or array shapes.
  role: string | string[];
}

export interface Credentials {
  email: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<User[]>('/user'),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      apiFetch<MessageResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<MessageResponse>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      // Wipe any cached protected data so nothing leaks after logout.
      queryClient.clear();
    },
  });
}
