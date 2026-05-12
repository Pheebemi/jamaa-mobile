import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSync } from '../hooks/useSync';

export function SyncButton() {
  const { triggerPush, triggerPull, isSyncing, isPulling, isOnline, pendingCount } = useSync();

  return (
    <View className="flex-row items-center gap-2">

      {/* UPLOAD */}
      <TouchableOpacity
        onPress={triggerPush}
        disabled={isSyncing || isPulling || !isOnline}
        className="relative items-center justify-center w-9 h-9 rounded-full bg-green-700 active:opacity-70"
        accessibilityLabel="Upload pending cases"
      >
        {isSyncing
          ? <ActivityIndicator size="small" color="#fff" />
          : <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
        }
        {pendingCount > 0 && !isSyncing && (
          <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 items-center justify-center">
            <Text className="text-white text-xs font-bold" style={{ fontSize: 9 }}>
              {pendingCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* DOWNLOAD */}
      <TouchableOpacity
        onPress={triggerPull}
        disabled={isSyncing || isPulling || !isOnline}
        className="items-center justify-center w-9 h-9 rounded-full bg-blue-600 active:opacity-70"
        accessibilityLabel="Download latest from server"
      >
        {isPulling
          ? <ActivityIndicator size="small" color="#fff" />
          : <Ionicons name="cloud-download-outline" size={18} color="#fff" />
        }
      </TouchableOpacity>

    </View>
  );
}
