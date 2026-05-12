import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Switch, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCaseStore } from '../../../src/stores/caseStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { Toast } from '../../../src/components/Toast';

const CASE_TYPES = [
  { value: 'child_absenteeism', label: 'Child Absenteeism' },
  { value: 'malnutrition', label: 'Malnutrition' },
  { value: 'flood_impact', label: 'Flood Impact' },
  { value: 'medical', label: 'Medical Follow-up' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'child_protection', label: 'Child Protection' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'high', label: 'High', color: 'bg-red-100 border-red-300', textColor: 'text-red-700' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 border-amber-300', textColor: 'text-amber-700' },
  { value: 'low', label: 'Low', color: 'bg-green-100 border-green-300', textColor: 'text-green-700' },
];

const newCaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.string().min(1, 'Select a case type'),
  priority: z.enum(['high', 'medium', 'low']),
  is_sensitive: z.boolean().default(false),
});

type NewCaseForm = z.infer<typeof newCaseSchema>;

export default function NewCaseScreen() {
  const { createCase } = useCaseStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<NewCaseForm>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: { priority: 'medium', is_sensitive: false },
  });

  const selectedType = watch('type');
  const selectedPriority = watch('priority');
  const isSensitive = watch('is_sensitive');

  async function getLocation() {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Location denied', text2: 'Enable location in settings.' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      Toast.show({ type: 'error', text1: 'Location error', text2: 'Could not get location.' });
    } finally {
      setGettingLocation(false);
    }
  }

  async function onSubmit(data: NewCaseForm) {
    if (!user) return;
    setIsLoading(true);
    try {
      await createCase(
        {
          title: data.title,
          description: data.description,
          type: data.type,
          priority: data.priority,
          is_sensitive: data.is_sensitive,
          location_lat: location?.lat,
          location_lng: location?.lng,
        },
        user.id,
        user.org_id,
      );
      Toast.show({ type: 'success', text1: 'Case created', text2: 'Saved locally. Sync when online.' });
      router.back();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to create case', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="px-4 pt-4 pb-12" keyboardShouldPersistTaps="handled">

        {/* Title */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Case Title *</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-xl px-4 py-3 text-gray-900 bg-gray-50 text-base ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
                placeholder="Brief case title..."
                placeholderTextColor="#9ca3af"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.title && <Text className="text-red-500 text-xs mt-1">{errors.title.message}</Text>}
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Description *</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-xl px-4 py-3 text-gray-900 bg-gray-50 text-base ${errors.description ? 'border-red-400' : 'border-gray-200'}`}
                placeholder="Describe the situation in detail..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.description && <Text className="text-red-500 text-xs mt-1">{errors.description.message}</Text>}
        </View>

        {/* Type */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Case Type *</Text>
          <View className="flex-row flex-wrap gap-2">
            {CASE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setValue('type', t.value)}
                className={`px-3 py-2 rounded-lg border ${selectedType === t.value ? 'bg-green-700 border-green-700' : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-xs font-medium ${selectedType === t.value ? 'text-white' : 'text-gray-700'}`}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.type && <Text className="text-red-500 text-xs mt-1">{errors.type.message}</Text>}
        </View>

        {/* Priority */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Priority *</Text>
          <View className="flex-row gap-2">
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                onPress={() => setValue('priority', p.value as any)}
                className={`flex-1 py-3 rounded-xl border items-center ${selectedPriority === p.value ? p.color : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-sm font-semibold ${selectedPriority === p.value ? p.textColor : 'text-gray-500'}`}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Location (optional)</Text>
          <TouchableOpacity
            onPress={getLocation}
            disabled={gettingLocation}
            className="flex-row items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color="#15803d" />
            ) : (
              <Ionicons name={location ? 'location' : 'location-outline'} size={18} color={location ? '#15803d' : '#9ca3af'} />
            )}
            <Text className={`text-sm ${location ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
              {location
                ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                : 'Tap to capture GPS coordinates'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sensitive toggle */}
        <View className="mb-6 flex-row items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-medium text-gray-800">Mark as Sensitive</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Restricts access — only admins and assigned officer can view full details.
            </Text>
          </View>
          <Controller
            control={control}
            name="is_sensitive"
            render={({ field: { value, onChange } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#e5e7eb', true: '#15803d' }}
                thumbColor="#fff"
              />
            )}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${isLoading ? 'bg-green-500' : 'bg-green-700'} active:opacity-80`}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Save Case Locally</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
