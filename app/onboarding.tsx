// GoalMind — Onboarding Screen
// First-time user experience.

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/types';
import { Button } from '@/components/ui';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    icon: 'football',
    title: 'Welcome to GoalMind',
    description: 'Your AI-powered football companion. Get tactical analysis, predictions, and engage with fans — all on your device.',
    color: COLORS.primary,
  },
  {
    id: 2,
    icon: 'phone-portrait',
    title: '100% On-Device AI',
    description: 'All AI inference runs locally using QVAC SDK. No cloud, no API keys, no data leaving your phone.',
    color: COLORS.secondary,
  },
  {
    id: 3,
    icon: 'wallet',
    title: 'Self-Custodial Wallet',
    description: 'Built with Tether WDK. Your keys, your crypto. Tip fans, stake predictions, and earn rewards.',
    color: COLORS.accent,
  },
  {
    id: 4,
    icon: 'airplane',
    title: 'Works Offline',
    description: 'Use GoalMind anywhere — in the stadium, on a plane, or in areas with no connectivity.',
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

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <View style={styles.header}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
          <Ionicons name={step.icon} size={64} color={step.color} />
        </View>
        
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </View>

      {/* Progress */}
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

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={currentStep === steps.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          icon={currentStep === steps.length - 1 ? "rocket" : "arrow-forward"}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: COLORS.primaryMuted,
  },
  actions: {
    gap: 12,
  },
});
