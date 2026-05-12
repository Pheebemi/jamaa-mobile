import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { useSyncStore } from '../../src/sync/useSyncStore';
import { expoDb } from '../../src/db';
import { Toast } from '../../src/components/Toast';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Organisation Admin',
  field_officer: 'Field Officer',
  school_staff: 'School Staff',
  clinic_staff: 'Clinic Staff',
};

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { lastSyncAt, lastResult, setPendingCount } = useSyncStore();

  function confirmLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Unsynced data will remain on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  }

  function confirmReset() {
    Alert.alert(
      'Reset Local Data',
      '⚠️ This will delete ALL cases stored on this device.\n\nCases already synced to the server can be recovered by tapping Download.\n\nCases that were NEVER synced will be lost forever.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Local Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'This cannot be undone. Unsynced cases will be permanently lost.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: resetLocalData,
                },
              ]
            );
          },
        },
      ]
    );
  }

  async function resetLocalData() {
    try {
      expoDb.runSync(`DELETE FROM case_notes`);
      expoDb.runSync(`DELETE FROM cases`);
      expoDb.runSync(`DELETE FROM alerts`);
      expoDb.runSync(`DELETE FROM sync_log`);
      await SecureStore.setItemAsync('last_sync_at', '1970-01-01T00:00:00.000Z');
      setPendingCount(0);
      Toast.show({
        type: 'success',
        text1: 'Local data cleared',
        text2: 'Tap Download to restore your synced cases.',
      });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Reset failed', text2: err.message });
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-16">
      {/* Avatar + name */}
      <View className="bg-white px-5 pt-10 pb-8 items-center border-b border-gray-100">
        <View className="w-28 h-28 rounded-full bg-green-700 items-center justify-center mb-4">
          <Text className="text-5xl font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900">{user?.name ?? 'User'}</Text>
        <Text className="text-base text-gray-500 mt-1">{user?.email ?? ''}</Text>
        <View className="mt-3 px-4 py-1.5 bg-green-50 rounded-full">
          <Text className="text-sm font-semibold text-green-700">
            {ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? 'Unknown Role'}
          </Text>
        </View>
      </View>

      {/* Sync stats */}
      <View className="mx-5 mt-5 bg-white rounded-3xl p-5">
        <Text className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Sync Stats</Text>
        {lastSyncAt ? (
          <>
            <Text className="text-base text-gray-600">
              Last sync:{' '}
              <Text className="font-semibold text-gray-900">
                {new Date(lastSyncAt).toLocaleString('en-GB')}
              </Text>
            </Text>
            {lastResult && (
              <View className="flex-row gap-6 mt-5">
                <View className="items-center">
                  <Text className="text-3xl font-bold text-green-700">{lastResult.pushed}</Text>
                  <Text className="text-sm text-gray-500 mt-1">Pushed</Text>
                </View>
                {lastResult.conflicts > 0 && (
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-amber-600">{lastResult.conflicts}</Text>
                    <Text className="text-sm text-gray-500 mt-1">Conflicts</Text>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <Text className="text-base text-gray-400">Never synced</Text>
        )}
      </View>

      {/* App info */}
      <View className="mx-5 mt-4 bg-white rounded-3xl p-5">
        <Text className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">About</Text>
        <Text className="text-base font-semibold text-gray-700">Jamaa v1.0.0</Text>
        <Text className="text-sm text-gray-400 mt-1">Offline-First AI Case Management Platform</Text>
        <Text className="text-sm text-gray-400 mt-0.5">Built for West Africa · MIT License</Text>
      </View>

      {/* Reset local data */}
      <TouchableOpacity
        className="mx-5 mt-4 bg-white rounded-3xl p-5 flex-row items-center gap-4 border border-amber-200"
        onPress={confirmReset}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={24} color="#d97706" />
        <View className="flex-1">
          <Text className="text-amber-700 font-semibold text-base">Reset Local Data</Text>
          <Text className="text-amber-600 text-sm mt-0.5">
            Clears all local cases. Synced cases can be recovered via Download.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Sign out */}
      <TouchableOpacity
        className="mx-5 mt-4 bg-white rounded-3xl p-5 flex-row items-center gap-4 border border-red-100"
        onPress={confirmLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={24} color="#dc2626" />
        <Text className="text-red-600 font-semibold text-base">Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
