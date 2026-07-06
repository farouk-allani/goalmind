// GoalMind — Toast
// App-wide, non-blocking snackbar. Fades + slides up from the bottom, above the
// tab bar, and auto-dismisses. Used for lightweight confirmations (e.g. "copied")
// so we never interrupt the user with a modal Alert for trivial feedback.

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/types';
import { useToastStore } from '@/stores';

const ACCENT: Record<'success' | 'error' | 'info', string> = {
  success: COLORS.success,
  error: COLORS.error,
  info: COLORS.primary,
};

const DEFAULT_ICON: Record<'success' | 'error' | 'info', keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export function Toast() {
  const { id, message, type, icon, duration, hide } = useToastStore();
  const insets = useSafeAreaInsets();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;

    // Animate in
    opacity.setValue(0);
    translateY.setValue(24);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 220,
        mass: 0.7,
        useNativeDriver: true,
      }),
    ]).start();

    // Schedule dismiss
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 24,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => hide());
    }, duration);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // Re-run each time a new toast is shown (id increments per show()).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!message) return null;

  const accent = ACCENT[type] ?? COLORS.success;
  const glyph = (icon as keyof typeof Ionicons.glyphMap) ?? DEFAULT_ICON[type] ?? 'checkmark-circle';

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { bottom: insets.bottom + 78 }]}
    >
      <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
          <Ionicons name={glyph} size={16} color={accent} />
        </View>
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 420,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.text,
  },
});
