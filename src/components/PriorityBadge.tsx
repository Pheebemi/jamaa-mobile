import { View, Text } from 'react-native';

type Priority = 'high' | 'medium' | 'low';

interface Props {
  priority: Priority;
}

const CONFIG: Record<Priority, { container: string; text: string; label: string }> = {
  high:   { container: 'bg-red-100',   text: 'text-red-700',   label: 'High' },
  medium: { container: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  low:    { container: 'bg-green-100', text: 'text-green-700', label: 'Low' },
};

export function PriorityBadge({ priority }: Props) {
  const cfg = CONFIG[priority] ?? CONFIG.low;
  return (
    <View className={`px-2.5 py-1 rounded-full ${cfg.container}`}>
      <Text className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</Text>
    </View>
  );
}
