import '../global.css';
import { useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, router, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { runMigrations } from '../src/db';
import { ToastProvider } from '../src/components/Toast';

export default function RootLayout() {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    async function boot() {
      await runMigrations();
      await initialize();
    }
    boot();
  }, []);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace('/(app)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [navigationState?.key, isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  return (
    <>
      <Slot />
      <ToastProvider />
    </>
  );
}
