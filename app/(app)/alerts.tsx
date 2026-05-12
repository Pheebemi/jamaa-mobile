import { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { expoDb } from '../../src/db';

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

  function load() {
    try {
      const rows = expoDb.getAllSync<any>(`SELECT * FROM alerts ORDER BY received_at DESC`);
      setAlertList(rows);
    } catch {}
  }

  useEffect(() => { load(); }, []);

  function onRefresh() {
    setRefreshing(true);
    load();
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
          <View className={`rounded-2xl border p-4 mb-3 ${ALERT_COLORS[item.type] ?? 'bg-gray-50 border-gray-200'}`}>
            <View className="flex-row items-start gap-3">
              <Ionicons
                name={(ALERT_ICONS[item.type] ?? 'notifications') as any}
                size={20}
                color={ALERT_ICON_COLORS[item.type] ?? '#6b7280'}
              />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 capitalize">
                  {item.type.replace('_', ' ')}
                </Text>
                <Text className="text-sm text-gray-700 mt-1">{item.message}</Text>
                <Text className="text-xs text-gray-400 mt-2">
                  {new Date(item.received_at).toLocaleString('en-GB')}
                  {!item.read_at && (
                    <Text className="text-green-700 font-medium"> · New</Text>
                  )}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 text-base font-medium mt-4">No alerts</Text>
            <Text className="text-gray-300 text-sm mt-1 text-center px-8">
              Emergency alerts and broadcasts will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
