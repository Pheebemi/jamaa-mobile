import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Brand */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-green-700 items-center justify-center mb-4">
            <Ionicons name="people" size={36} color="#fff" />
          </View>
          <Text className="text-3xl font-bold text-gray-900">Jamaa</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Case Management & Emergency Support
          </Text>
        </View>

        {/* Error banner */}
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex-row items-center gap-2">
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text className="text-red-700 text-sm flex-1">{error}</Text>
          </View>
        )}

        {/* Email */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-xl px-4 py-3 text-gray-900 bg-gray-50 text-base ${
                  errors.email ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="field@organisation.org"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email && (
            <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>
          )}
        </View>

        {/* Password */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="relative">
                <TextInput
                  className={`border rounded-xl px-4 py-3 pr-12 text-gray-900 bg-gray-50 text-base ${
                    errors.password ? 'border-red-400' : 'border-gray-200'
                  }`}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3.5"
                  onPress={() => setShowPassword((p) => !p)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && (
            <Text className="text-red-500 text-xs mt-1">{errors.password.message}</Text>
          )}
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
            <Text className="text-white font-semibold text-base">Sign In</Text>
          )}
        </TouchableOpacity>

        <Text className="text-center text-gray-400 text-xs mt-8">
          Jamaa — Built for Africa. Offline-first.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
