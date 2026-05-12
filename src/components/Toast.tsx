import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  type: ToastType;
  text1: string;
  text2?: string;
}

type Listener = (msg: ToastMessage) => void;
const listeners: Listener[] = [];

export const Toast = {
  show: (msg: ToastMessage) => {
    listeners.forEach((l) => l(msg));
  },
};

const ICONS: Record<ToastType, string> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-green-700',
  error: 'bg-red-600',
  info: 'bg-blue-600',
};

export function ToastProvider() {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const listener = (msg: ToastMessage) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(msg);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2800),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(() => setMessage(null), 3200);
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  if (!message) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className={`absolute top-14 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex-row items-start gap-3 shadow-lg ${COLORS[message.type]}`}
    >
      <Ionicons name={ICONS[message.type] as any} size={20} color="#fff" />
      <View className="flex-1">
        <Text className="text-white font-semibold text-sm">{message.text1}</Text>
        {message.text2 && (
          <Text className="text-white/80 text-xs mt-0.5">{message.text2}</Text>
        )}
      </View>
    </Animated.View>
  );
}
