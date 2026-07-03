// GoalMind — Onboarding Screen
// First-time user experience.

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS } from '@/types';
import { Button } from '@/components/ui';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const heroImages = [
  require('@/assets/brand/hero-stadium.jpg'),
  require('@/assets/brand/hero-ondevice.jpg'),
  require('@/assets/brand/hero-wallet.jpg'),
  require('@/assets/brand/hero-stadium.jpg'), // reuse dramatic for offline/stadium
];

const steps: OnboardingStep[] = [
  {
    id: 1,
    icon: 'football',
    title: 'GoalMind for the Cup',
    description: 'Your personal on-device AI companion for the global knockout tournament. Analysis, predictions, and real fan engagement.',
    color: COLORS.primary,
  },
  {
    id: 2,
    icon: 'phone-portrait',
    title: 'True On-Device AI (QVAC)',
    description: 'Every insight — vision, tactics, commentary — runs locally via Tether QVAC. No cloud. No keys. Stadium privacy.',
    color: COLORS.secondary,
  },
  {
    id: 3,
    icon: 'wallet',
    title: 'Self-Custodial WDK Wallet',
    description: 'Tip fans. Stake on predictions. An intelligent agent acts on insights — all with keys you alone control.',
    color: COLORS.gold,
  },
  {
    id: 4,
    icon: 'airplane',
    title: 'Stadium Ready. Offline First.',
    description: 'Works deep in the stands during the biggest matches on earth. The companion fans actually need.',
    color: COLORS.success,
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Complete onboarding
      router.replace('/(tabs)');
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const step = steps[currentStep];

  const heroSource = heroImages[currentStep];

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={heroSource} 
        style={styles.heroBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(10,10,10,0.35)', 'rgba(10,10,10,0.85)', 'rgba(10,10,10,0.95)']}
          style={styles.heroOverlay}
        />

        {/* Skip */}
        <View style={styles.header}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Content layered on hero */}
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: step.color + '25', borderColor: step.color + '40' }]}>
            <Ionicons name={step.icon} size={52} color={step.color} />
          </View>
          
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <View style={styles.progress}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                  index < currentStep && styles.progressDotCompleted,
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              title={currentStep === steps.length - 1 ? "Enter GoalMind" : "Next"}
              onPress={handleNext}
              icon={currentStep === steps.length - 1 ? "arrow-forward" : "arrow-forward"}
              fullWidth
            />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroBackground: {
    flex: 1,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 60,
    zIndex: 10,
  },
  skipButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 120,
    zIndex: 10,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 0,
    lineHeight: 32,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: 'rgba(248,248,248,0.85)',
    textAlign: 'center',
    lineHeight: 25,
    maxWidth: 340,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    zIndex: 10,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 28,
  },
  progressDotCompleted: {
    backgroundColor: COLORS.primaryMuted,
  },
  actions: {
    gap: 12,
  },
});
