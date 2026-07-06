// GoalMind — Root Layout
// Dark theme, clean navigation, error boundary, no fluff.

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Orbitron_700Bold, Orbitron_800ExtraBold } from '@expo-google-fonts/orbitron';
import { COLORS } from '@/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Orbitron_700Bold, Orbitron_800ExtraBold });
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the native splash screen and show our controlled full-screen splash
      SplashScreen.hideAsync();
      // Small delay to ensure smooth transition, then mark ready
      const timer = setTimeout(() => setAppIsReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  // Show a full-screen covering splash image while loading (forces cover regardless of native config)
  if (!appIsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F1113' }}>
        <Image
          source={require('@/assets/brand/splash.jpg')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
    );
  }

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
              headerTitle: 'Tether Developers Cup • Match',
              headerStyle: { backgroundColor: COLORS.surface },
              headerTintColor: COLORS.text,
              headerTitleStyle: { fontWeight: '700', fontSize: 15 },
              presentation: 'modal',
            }}
          />
        </Stack>
        {/* App-wide non-blocking snackbar */}
        <Toast />
      </View>
    </ErrorBoundary>
  );
}
