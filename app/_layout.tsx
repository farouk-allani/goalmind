// GoalMind — Root Layout
// Dark theme, clean navigation, no fluff.

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { COLORS } from '@/types';

export default function RootLayout() {
  return (
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
  );
}
