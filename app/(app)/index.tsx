import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { expoDb } from '../../src/db';
import { useAuthStore } from '../../src/stores/authStore';
import { useSyncStore } from '../../src/sync/useSyncStore';

interface Stats {
  total: number;
  open: number;
  high: number;
  pending: number;
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { lastSyncAt } = useSyncStore();
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, high: 0, pending: 0 });
  const [refreshing, setRefreshing] = useState(false);

  function loadStats() {
    try {
      const all = expoDb.getAllSync<any>(`SELECT * FROM cases WHERE deleted_at IS NULL`);
      const open = all.filter((c: any) => c.status === 'open' || c.status === 'in_progress');
      const high = all.filter((c: any) => c.priority === 'high' && c.status !== 'resolved' && c.status !== 'closed');
      const pending = all.filter((c: any) => c.sync_status === 'pending');
      setStats({ total: all.length, open: open.length, high: high.length, pending: pending.length });
    } catch {}
  }

  useEffect(() => { loadStats(); }, [lastSyncAt]);

  function onRefresh() {
    setRefreshing(true);
    loadStats();
    setRefreshing(false);
  }

  const statCards = [
    { label: 'Total Cases', value: stats.total, icon: 'folder-open', color: 'bg-blue-50', iconColor: '#3b82f6', textColor: 'text-blue-700' },
    { label: 'Active Cases', value: stats.open, icon: 'time', color: 'bg-green-50', iconColor: '#15803d', textColor: 'text-green-700' },
    { label: 'High Priority', value: stats.high, icon: 'warning', color: 'bg-red-50', iconColor: '#dc2626', textColor: 'text-red-700' },
    { label: 'Pending Sync', value: stats.pending, icon: 'cloud-upload', color: 'bg-amber-50', iconColor: '#d97706', textColor: 'text-amber-700' },
  ];

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="px-5 pt-6 pb-10"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#15803d" />}
    >
      {/* Greeting */}
      <View className="mb-8">
        <Text className="text-4xl font-bold text-gray-900">
          Hello, {user?.name?.split(' ')[0] ?? 'Field Officer'} 👋
        </Text>
        <Text className="text-base text-gray-500 mt-1.5 capitalize">
          {user?.role?.replace(/_/g, ' ')} · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      {/* Stat cards */}
      <View className="flex-row flex-wrap gap-4 mb-6">
        {statCards.map((card) => (
          <View key={card.label} className={`flex-1 min-w-[44%] ${card.color} rounded-3xl p-5`}>
            <Ionicons name={card.icon as any} size={28} color={card.iconColor} />
            <Text className={`text-5xl font-bold mt-3 ${card.textColor}`}>{card.value}</Text>
            <Text className="text-sm font-medium text-gray-500 mt-2">{card.label}</Text>
          </View>
        ))}
      </View>

      {/* Sync status */}
      {lastSyncAt && (
        <View className="bg-white rounded-3xl p-5 border border-gray-100 mb-4">
          <Text className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">Last Sync</Text>
          <Text className="text-base font-medium text-gray-800">
            {new Date(lastSyncAt).toLocaleString('en-GB')}
          </Text>
        </View>
      )}

      {/* Offline notice */}
      {stats.pending > 0 && (
        <View className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex-row items-center gap-4">
          <Ionicons name="cloud-offline-outline" size={26} color="#d97706" />
          <Text className="text-base text-amber-800 flex-1 font-medium">
            {stats.pending} case{stats.pending !== 1 ? 's' : ''} waiting to sync. Tap Sync when online.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
