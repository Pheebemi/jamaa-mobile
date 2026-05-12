import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { expoDb } from '../../../src/db';
import { CaseCard } from '../../../src/components/CaseCard';
import { useSyncStore } from '../../../src/sync/useSyncStore';

type Filter = 'all' | 'open' | 'high' | 'pending';

export default function CasesScreen() {
  const [caseList, setCaseList] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { lastSyncAt } = useSyncStore();

  function loadCases() {
    try {
      const all = expoDb.getAllSync<any>(
        `SELECT * FROM cases WHERE deleted_at IS NULL ORDER BY created_at DESC`
      );
      setCaseList(all);
    } catch {}
  }

  useEffect(() => { loadCases(); }, [lastSyncAt]);

  function onRefresh() {
    setRefreshing(true);
    loadCases();
    setRefreshing(false);
  }

  const filtered = caseList.filter((c) => {
    const matchesSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'open' && (c.status === 'open' || c.status === 'in_progress')) ||
      (filter === 'high' && c.priority === 'high') ||
      (filter === 'pending' && c.sync_status === 'pending');

    return matchesSearch && matchesFilter;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Active' },
    { key: 'high', label: 'High' },
    { key: 'pending', label: 'Pending' },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search */}
      <View className="px-5 pt-5 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3.5 gap-3">
          <Ionicons name="search-outline" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 text-gray-900 text-base"
            placeholder="Search cases..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <View className="flex-row gap-2 mt-4">
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full ${filter === f.key ? 'bg-green-700' : 'bg-gray-100'}`}
            >
              <Text className={`text-sm font-semibold ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mx-5 mt-4"
            onPress={() => router.push(`/(app)/cases/${item.id}`)}
            activeOpacity={0.7}
          >
            <CaseCard case={item} />
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#15803d" />}
        ListEmptyComponent={
          <View className="items-center justify-center py-24 px-8">
            <Ionicons name="folder-open-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-400 text-xl font-semibold mt-5 text-center">No cases found</Text>
            <Text className="text-gray-300 text-base mt-2 text-center">
              {search ? 'Try a different search term.' : 'Tap + to create the first case.'}
            </Text>
          </View>
        }
        contentContainerClassName="pb-28"
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 w-16 h-16 bg-green-700 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/(app)/cases/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={34} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
