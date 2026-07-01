// GoalMind — Root Layout
// Dark theme, clean navigation, error boundary, no fluff.

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { COLORS } from '@/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen
            name="match/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Match Analysis',
              headerStyle: { backgroundColor: COLORS.surface },
              headerTintColor: COLORS.text,
              presentation: 'modal',
            }}
          />
        </Stack>
      </View>
    </ErrorBoundary>
  );
}
