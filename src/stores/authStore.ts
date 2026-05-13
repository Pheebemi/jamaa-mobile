import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { router } from 'expo-router';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'org_admin' | 'field_officer' | 'school_staff' | 'clinic_staff';
  org_id: string;
  org_name?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,

  initialize: async () => {
    set({ isLoading: true });

    const accessToken  = await SecureStore.getItemAsync('access_token');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    const cachedUser   = await SecureStore.getItemAsync('cached_user');

    if (!accessToken || !refreshToken) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    const net = await NetInfo.fetch();
    const isOnline = !!net.isConnected && !!net.isInternetReachable;

    if (!isOnline) {
      set({
        isAuthenticated: true,
        isLoading: false,
        user: cachedUser ? JSON.parse(cachedUser) : null,
      });
      return;
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });
      await SecureStore.setItemAsync('access_token', data.access);

      const { data: user } = await axios.get(`${BASE_URL}/auth/me/`, {
        headers: { Authorization: `Bearer ${data.access}` },
      });
      await SecureStore.setItemAsync('cached_user', JSON.stringify(user));

      set({ isAuthenticated: true, isLoading: false, user });
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('cached_user');
      set({ isAuthenticated: false, isLoading: false, user: null });
    }
  },

  login: async (email, password) => {
    const { data } = await axios.post(`${BASE_URL}/auth/login/`, { email, password });
    await SecureStore.setItemAsync('access_token', data.access);
    await SecureStore.setItemAsync('refresh_token', data.refresh);
    await SecureStore.setItemAsync('cached_user', JSON.stringify(data.user));
    set({ isAuthenticated: true, user: data.user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('cached_user');
    set({ isAuthenticated: false, user: null });
    router.replace('/(auth)/login');
  },
}));
