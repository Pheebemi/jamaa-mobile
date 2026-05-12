import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Case } from '../db/schema';

interface Props {
  case: Case;
}

export function AIInsightCard({ case: c }: Props) {
  if (!c.ai_summary && !c.ai_urgency_score && !c.ai_suggested_action) return null;

  const urgency = c.ai_urgency_score ?? 0;
  const urgencyColor =
    urgency >= 7 ? 'text-red-600' :
    urgency >= 4 ? 'text-amber-600' : 'text-green-600';

  return (
    <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="sparkles" size={16} color="#2563eb" />
        <Text className="text-xs font-semibold text-blue-700 uppercase tracking-wide">AI Analysis</Text>
      </View>

      {c.ai_summary && (
        <Text className="text-sm text-gray-700 leading-5 mb-3">{c.ai_summary}</Text>
      )}

      <View className="flex-row flex-wrap gap-3">
        {c.ai_urgency_score != null && (
          <View className="items-center bg-white rounded-xl px-3 py-2">
            <Text className={`text-lg font-bold ${urgencyColor}`}>{c.ai_urgency_score}/10</Text>
            <Text className="text-xs text-gray-400">Urgency</Text>
          </View>
        )}

        {c.ai_priority && (
          <View className="items-center bg-white rounded-xl px-3 py-2">
            <Text className="text-sm font-semibold text-gray-700 capitalize">{c.ai_priority}</Text>
            <Text className="text-xs text-gray-400">AI Priority</Text>
          </View>
        )}

        {c.ai_category && (
          <View className="items-center bg-white rounded-xl px-3 py-2">
            <Text className="text-sm font-semibold text-gray-700 capitalize">
              {c.ai_category.replace('_', ' ')}
            </Text>
            <Text className="text-xs text-gray-400">Category</Text>
          </View>
        )}
      </View>

      {c.ai_suggested_action && (
        <View className="mt-3 bg-white rounded-xl p-3 flex-row items-start gap-2">
          <Ionicons name="arrow-forward-circle" size={16} color="#15803d" />
          <Text className="text-sm text-gray-700 flex-1">{c.ai_suggested_action}</Text>
        </View>
      )}
    </View>
  );
}
