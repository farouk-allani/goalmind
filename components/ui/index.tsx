// GoalMind — UI Components
// Reusable, clean, no-fluff components.

import { View, Text, Pressable, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '@/types';

// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string; useGradient?: boolean }> = {
    primary: { bg: COLORS.primary, text: COLORS.background, useGradient: true },
    secondary: { bg: COLORS.secondary, text: COLORS.background },
    outline: { bg: 'transparent', text: COLORS.text, border: COLORS.border },
    ghost: { bg: 'transparent', text: COLORS.textMuted },
  };

  const sizeStyles: Record<ButtonSize, { py: number; px: number; fontSize: number; iconSize: number }> = {
    sm: { py: 8, px: 12, fontSize: 13, iconSize: 16 },
    md: { py: 12, px: 20, fontSize: 15, iconSize: 18 },
    lg: { py: 16, px: 28, fontSize: 17, iconSize: 20 },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const isGradientPrimary = variant === 'primary';

  const buttonContent = loading ? (
    <ActivityIndicator color={v.text} size="small" />
  ) : (
    <>
      {icon && <Ionicons name={icon} size={s.iconSize} color={v.text} />}
      <Text style={[styles.buttonText, { color: v.text, fontSize: s.fontSize }]}>
        {title}
      </Text>
    </>
  );

  if (isGradientPrimary) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.button,
          {
            paddingVertical: s.py,
            paddingHorizontal: s.px,
            opacity: pressed ? 0.88 : disabled ? 0.5 : 1,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientButton, { borderRadius: 12 }]}
        >
          {buttonContent}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: v.bg,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: v.border,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {buttonContent}
    </Pressable>
  );
}

// Card component
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'elevated' && styles.cardElevated,
      variant === 'outlined' && styles.cardOutlined,
      style,
    ]}>
      {children}
    </View>
  );
}

// Badge component
interface BadgeProps {
  label: string;
  color?: string;
  variant?: 'filled' | 'outline';
}

export function Badge({ label, color = COLORS.primary, variant = 'filled' }: BadgeProps) {
  return (
    <View style={[
      styles.badge,
      { backgroundColor: variant === 'filled' ? color + '20' : 'transparent' },
      variant === 'outline' && { borderWidth: 1, borderColor: color },
    ]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// Progress Bar
interface ProgressBarProps {
  value: number; // 0-1
  color?: string;
  height?: number;
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, color = COLORS.primary, height = 6, label, showValue }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value * 100));

  return (
    <View style={styles.progressContainer}>
      {label && (
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          {showValue && <Text style={styles.progressValue}>{percentage.toFixed(0)}%</Text>}
        </View>
      )}
      <View style={[styles.progressTrack, { height }]}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// Stat Display
interface StatProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Stat({ label, value, change, icon }: StatProps) {
  return (
    <View style={styles.stat}>
      {icon && <Ionicons name={icon} size={16} color={COLORS.textDim} />}
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {change !== undefined && (
        <Text style={[styles.statChange, { color: change >= 0 ? COLORS.success : COLORS.error }]}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </Text>
      )}
    </View>
  );
}

// Empty State
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={48} color={COLORS.textDim} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {action && (
        <Button title={action.label} onPress={action.onPress} variant="outline" size="sm" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 'inherit',
    paddingHorizontal: 'inherit',
    borderRadius: 12,
  },
  buttonText: {
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardOutlined: {
    backgroundColor: 'transparent',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressContainer: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  progressValue: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  progressTrack: {
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
