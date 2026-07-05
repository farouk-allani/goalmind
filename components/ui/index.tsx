// GoalMind — UI Components
// Goalix design system: charcoal canvas, lime accent, rounded-full pill buttons.

import { View, Text, Pressable, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, TYPE } from '@/types';

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
  /** Trailing circular chevron badge (primary/secondary only). Defaults on for md/lg. */
  arrowBadge?: boolean;
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
  arrowBadge,
  style,
}: ButtonProps) {
  const sizeStyles: Record<ButtonSize, { py: number; px: number; fontSize: number; iconSize: number; badge: number }> = {
    sm: { py: 10, px: 18, fontSize: 12, iconSize: 15, badge: 22 },
    md: { py: 14, px: 24, fontSize: 13, iconSize: 17, badge: 28 },
    lg: { py: 18, px: 32, fontSize: 14, iconSize: 19, badge: 32 },
  };
  const s = sizeStyles[size];
  const showArrowBadge = (arrowBadge ?? size !== 'sm') && (variant === 'primary' || variant === 'secondary');

  const textColor =
    variant === 'primary' ? COLORS.background :
    variant === 'secondary' ? '#FFFFFF' :
    variant === 'outline' ? COLORS.text :
    COLORS.primary; // ghost/tertiary — lime uppercase text

  const buttonInner = loading ? (
    <ActivityIndicator color={textColor} size="small" />
  ) : (
    <>
      {icon && <Ionicons name={icon} size={s.iconSize} color={textColor} />}
      <Text style={[styles.buttonText, { color: textColor, fontSize: s.fontSize }]} numberOfLines={1}>
        {title}
      </Text>
      {variant === 'ghost' && (
        <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
      )}
      {showArrowBadge && (
        <View
          style={[
            styles.arrowBadge,
            {
              width: s.badge,
              height: s.badge,
              borderRadius: s.badge / 2,
              backgroundColor: variant === 'primary' ? '#FFFFFF' : 'rgba(255,255,255,0.16)',
            },
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={s.badge * 0.55}
            color={variant === 'primary' ? COLORS.background : '#FFFFFF'}
          />
        </View>
      )}
    </>
  );

  if (variant === 'primary') {
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
          style={styles.gradientButton}
        >
          {buttonInner}
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
          backgroundColor: variant === 'secondary' ? COLORS.surfaceElevated : 'transparent',
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
          borderWidth: variant === 'outline' ? 1 : variant === 'secondary' ? 1 : 0,
          borderColor: variant === 'outline' ? COLORS.text + '30' : 'rgba(255,255,255,0.1)',
        },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {buttonInner}
    </Pressable>
  );
}

// Pill — capsule filter/tab chip (sport selector, tab bars, language selectors, LIVE indicator).
type PillVariant = 'active' | 'inactive' | 'live' | 'favourite' | 'add';

interface PillProps {
  label: string;
  variant?: PillVariant;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Pill({ label, variant = 'inactive', onPress, style }: PillProps) {
  const isActive = variant === 'active' || variant === 'live' || variant === 'favourite';
  const bg =
    variant === 'add' ? COLORS.primary :
    isActive ? '#FFFFFF' :
    COLORS.surfaceElevated;
  const textColor = variant === 'add' || isActive ? COLORS.background : COLORS.muted;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        { backgroundColor: bg, borderColor: isActive || variant === 'add' ? 'transparent' : COLORS.muted + '30' },
        style,
      ]}
    >
      {variant === 'live' && <View style={styles.liveDot} />}
      {variant === 'favourite' && (
        <Ionicons name="star" size={11} color={textColor} style={{ marginRight: 2 }} />
      )}
      <Text style={[styles.pillText, { color: textColor }]}>{label}</Text>
      {variant === 'add' && <Ionicons name="add" size={13} color={textColor} style={{ marginLeft: 2 }} />}
    </Pressable>
  );
}

// Card component
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'nested';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'elevated' && styles.cardElevated,
      variant === 'outlined' && styles.cardOutlined,
      variant === 'nested' && styles.cardNested,
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
  variant?: 'filled' | 'outline' | 'solid';
}

export function Badge({ label, color = COLORS.primary, variant = 'filled' }: BadgeProps) {
  return (
    <View style={[
      styles.badge,
      { backgroundColor: variant === 'filled' ? color + '20' : variant === 'solid' ? color : 'transparent' },
      variant === 'outline' && { borderWidth: 1, borderColor: color },
    ]}>
      <Text style={[styles.badgeText, { color: variant === 'solid' ? COLORS.background : color }]}>{label}</Text>
    </View>
  );
}

// Progress Bar — linear determinate, 5%-opacity track.
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

// Stepped Progress — row of discrete pill segments (e.g. "4 of 6").
interface SteppedProgressProps {
  steps: number;
  completed: number;
  color?: string;
}

export function SteppedProgress({ steps, completed, color = COLORS.primary }: SteppedProgressProps) {
  return (
    <View style={styles.steppedRow}>
      {Array.from({ length: steps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.steppedSegment,
            { backgroundColor: i < completed ? color : 'rgba(255,255,255,0.08)' },
          ]}
        />
      ))}
    </View>
  );
}

// Circular Progress Ring
interface CircularProgressProps {
  value: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}

export function CircularProgress({
  value,
  size = 72,
  strokeWidth = 6,
  color = COLORS.primary,
  trackColor = 'rgba(255,255,255,0.08)',
  label,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, value));
  const offset = circumference * (1 - clamped);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.text, fontSize: size * 0.24, fontWeight: '700' }}>
            {Math.round(clamped * 100)}%
          </Text>
          {label && <Text style={{ color: COLORS.textDim, fontSize: 9, marginTop: 1 }}>{label}</Text>}
        </View>
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

// Mini Stats Grid — 4-column tile matrix (real, caller-supplied values only).
export interface StatTileData {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color?: string;
}

export function MiniStatsGrid({ items }: { items: StatTileData[] }) {
  return (
    <View style={styles.statsGrid}>
      {items.map((item, i) => (
        <View key={i} style={styles.statTile}>
          <Ionicons name={item.icon} size={16} color={item.color ?? COLORS.primary} />
          <Text style={styles.statTileValue}>{item.value}</Text>
          <Text style={styles.statTileLabel}>{item.label}</Text>
        </View>
      ))}
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
    gap: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 999,
  },
  buttonText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  arrowBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.error,
    marginRight: 4,
  },
  card: {
    // Slate surface — stands out against the charcoal page canvas.
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
  cardNested: {
    // Charcoal — for elements nested inside a (slate) Card, e.g. a CTA segment.
    backgroundColor: COLORS.background,
    borderColor: 'transparent',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  steppedRow: {
    flexDirection: 'row',
    gap: 6,
  },
  steppedSegment: {
    flex: 1,
    height: 5,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  statTileValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statTileLabel: {
    fontSize: 11,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
