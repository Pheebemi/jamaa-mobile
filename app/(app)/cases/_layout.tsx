import { Stack } from 'expo-router';

export default function CasesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
        headerTitleStyle: { color: '#111827', fontWeight: '700' },
        headerTintColor: '#15803d',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Cases', headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'New Case', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Case Detail' }} />
    </Stack>
  );
}
