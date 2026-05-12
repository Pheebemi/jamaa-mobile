import { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { expoDb } from '../../src/db';
import { useSyncStore } from '../../src/sync/useSyncStore';
import apiClient from '../../src/api/client';
import { randomUUID } from 'expo-crypto';
import NetInfo from '@react-native-community/netinfo';

const ALERT_ICONS: Record<string, string> = {
  emergency: 'warning',
  outbreak: 'medical',
  flood: 'water',
  missing_child: 'person-remove',
  general: 'megaphone',
};

const ALERT_COLORS: Record<string, string> = {
  emergency: 'bg-red-50 border-red-200',
  outbreak: 'bg-purple-50 border-purple-200',
  flood: 'bg-blue-50 border-blue-200',
  missing_child: 'bg-orange-50 border-orange-200',
  general: 'bg-gray-50 border-gray-200',
};

const ALERT_ICON_COLORS: Record<string, string> = {
  emergency: '#dc2626',
  outbreak: '#7c3aed',
  flood: '#2563eb',
  missing_child: '#ea580c',
  general: '#6b7280',
};

export default function AlertsScreen() {
  const [alertList, setAlertList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { lastSyncAt } = useSyncStore();

  function loadLocal() {
    try {
      const rows = expoDb.getAllSync<any>(`SELECT * FROM alerts ORDER BY received_at DESC`);
      setAlertList(rows);
    } catch {}
  }

  async function fetchFromServer() {
    const net = await NetInfo.fetch();
    if (!net.isConnected || !net.isInternetReachable) return;
    try {
      const res = await apiClient.get('/alerts/', { timeout: 10000 });
      const serverAlerts: any[] = res.data?.results ?? res.data ?? [];
      for (const sa of serverAlerts) {
        const existing = expoDb.getFirstSync<{ id: string }>(
          `SELECT id FROM alerts WHERE server_id = ?`, [sa.id]
        );
        if (!existing) {
          expoDb.runSync(
            `INSERT OR IGNORE INTO alerts (id, server_id, type, message, sent_by, received_at, sync_status)
             VALUES (?,?,?,?,?,?,?)`,
            [randomUUID(), sa.id, sa.type, sa.message, sa.sent_by ?? null,
             sa.created_at ?? new Date().toISOString(), 'synced']
          );
        }
      }
      loadLocal();
    } catch {}
  }

  useEffect(() => {
    loadLocal();
    fetchFromServer();
  }, []);

  useEffect(() => { loadLocal(); }, [lastSyncAt]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchFromServer();
    setRefreshing(false);
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={alertList}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#15803d" />}
        contentContainerClassName="px-4 pt-4 pb-8"
        renderItem={({ item }) => (
          <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-start gap-4">
              <View className={`w-11 h-11 rounded-2xl items-center justify-center ${
                item.type === 'emergency'    ? 'bg-red-100' :
                item.type === 'outbreak'     ? 'bg-purple-100' :
                item.type === 'flood'        ? 'bg-blue-100' :
                item.type === 'missing_child'? 'bg-orange-100' : 'bg-gray-100'
              }`}>
                <Ionicons
                  name={(ALERT_ICONS[item.type] ?? 'notifications') as any}
                  size={22}
                  color={ALERT_ICON_COLORS[item.type] ?? '#6b7280'}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-gray-900 capitalize">
                    {item.type.replace('_', ' ')}
                  </Text>
                  {!item.read_at && (
                    <View className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                </View>
                <Text className="text-base text-gray-700 mt-1.5 leading-6">{item.message}</Text>
                <Text className="text-xs text-gray-400 mt-3">
                  {new Date(item.received_at).toLocaleString('en-GB')}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-24">
            <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-400 text-xl font-semibold mt-5">No alerts</Text>
            <Text className="text-gray-300 text-base mt-2 text-center px-8">
              Emergency alerts and broadcasts from your organisation will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
