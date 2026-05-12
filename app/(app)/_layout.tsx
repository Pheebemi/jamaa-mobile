import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SyncButton } from '../../src/components/SyncButton';
import { OfflineBanner } from '../../src/components/OfflineBanner';

export default function AppLayout() {
  return (
    <View className="flex-1">
      <OfflineBanner />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#15803d',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            borderTopColor: '#e5e7eb',
            backgroundColor: '#fff',
          },
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerTitleStyle: { color: '#111827', fontWeight: '700' },
          headerRight: () => <SyncButton />,
          headerRightContainerStyle: { paddingRight: 16 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="cases"
          options={{
            title: 'Cases',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="folder-open-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="notifications-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
