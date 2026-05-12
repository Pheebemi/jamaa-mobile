import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  if (isOnline) return null;

  return (
    <View className="bg-amber-500 px-4 py-2 flex-row items-center gap-2">
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <Text className="text-white text-xs font-medium">
        Offline — changes saved locally. Tap Sync when connected.
      </Text>
    </View>
  );
}
