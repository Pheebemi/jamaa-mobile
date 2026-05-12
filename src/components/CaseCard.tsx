import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PriorityBadge } from './PriorityBadge';
import type { Case } from '../db/schema';

interface Props {
  case: Case;
}

const SYNC_DOT: Record<string, string> = {
  synced:   'bg-green-400',
  pending:  'bg-amber-400',
  conflict: 'bg-red-500',
};

const TYPE_LABELS: Record<string, string> = {
  child_absenteeism: 'Absenteeism',
  malnutrition: 'Malnutrition',
  flood_impact: 'Flood Impact',
  medical: 'Medical',
  emergency: 'Emergency',
  child_protection: 'Child Protection',
  other: 'Other',
};

export function CaseCard({ case: c }: Props) {
  const isSensitive = c.is_sensitive;

  return (
    <View className="bg-white rounded-3xl p-5 border border-gray-100">
      {/* Top row */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          {isSensitive ? (
            <View className="flex-row items-center gap-2">
              <Ionicons name="lock-closed" size={16} color="#dc2626" />
              <Text className="text-base font-semibold text-red-700" numberOfLines={1}>
                Sensitive Case — Restricted
              </Text>
            </View>
          ) : (
            <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
              {c.title}
            </Text>
          )}
        </View>
        <PriorityBadge priority={c.priority as any} />
      </View>

      {/* Description preview */}
      {!isSensitive && (
        <Text className="text-sm text-gray-500 mt-2" numberOfLines={2}>
          {c.description}
        </Text>
      )}

      {/* Bottom row */}
      <View className="flex-row items-center justify-between mt-4">
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1.5">
            <View className={`w-2.5 h-2.5 rounded-full ${SYNC_DOT[c.sync_status] ?? 'bg-gray-300'}`} />
            <Text className="text-sm text-gray-400 capitalize">{c.sync_status}</Text>
          </View>
          <Text className="text-gray-200">·</Text>
          <Text className="text-sm text-gray-400">{TYPE_LABELS[c.type] ?? c.type}</Text>
        </View>
        <Text className="text-sm text-gray-400">
          {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </Text>
      </View>

      {/* AI urgency bar */}
      {c.ai_urgency_score != null && !isSensitive && (
        <View className="mt-4 pt-4 border-t border-gray-50">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-sm text-gray-400">AI Urgency</Text>
            <Text className="text-sm font-semibold text-gray-600">{c.ai_urgency_score}/10</Text>
          </View>
          <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${
                c.ai_urgency_score >= 7 ? 'bg-red-500' :
                c.ai_urgency_score >= 4 ? 'bg-amber-400' : 'bg-green-500'
              }`}
              style={{ width: `${c.ai_urgency_score * 10}%` }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
