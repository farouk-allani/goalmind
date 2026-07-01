// GoalMind — Match Analysis Components
// Visual components for displaying AI match analysis.

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { ProgressBar, Card, Badge } from '@/components/ui';

interface PossessionBarProps {
  home: number;
  away: number;
  homeTeam: string;
  awayTeam: string;
}

export function PossessionBar({ home, away, homeTeam, awayTeam }: PossessionBarProps) {
  return (
    <View style={styles.possessionContainer}>
      <View style={styles.possessionHeader}>
        <Text style={styles.teamLabel}>{homeTeam}</Text>
        <Text style={styles.possessionTitle}>Possession</Text>
        <Text style={styles.teamLabel}>{awayTeam}</Text>
      </View>
      <View style={styles.possessionBar}>
        <View style={[styles.possessionHome, { flex: home }]} />
        <View style={[styles.possessionAway, { flex: away }]} />
      </View>
      <View style={styles.possessionValues}>
        <Text style={[styles.possValue, { color: COLORS.primary }]}>{home}%</Text>
        <Text style={[styles.possValue, { color: COLORS.secondary }]}>{away}%</Text>
      </View>
    </View>
  );
}

interface MomentumGaugeProps {
  value: number; // -100 to 100
  homeTeam: string;
  awayTeam: string;
}

export function MomentumGauge({ value, homeTeam, awayTeam }: MomentumGaugeProps) {
  const normalized = (value + 100) / 200; // 0 to 1
  const isHome = value > 0;
  const absValue = Math.abs(value);

  return (
    <Card style={styles.momentumCard}>
      <View style={styles.momentumHeader}>
        <Ionicons name="pulse" size={18} color={COLORS.accent} />
        <Text style={styles.momentumTitle}>Momentum</Text>
      </View>
      
      <View style={styles.momentumTeams}>
        <Text style={[styles.momentumTeam, isHome && styles.momentumTeamActive]}>
          {homeTeam}
        </Text>
        <Text style={[styles.momentumTeam, !isHome && styles.momentumTeamActive]}>
          {awayTeam}
        </Text>
      </View>

      <View style={styles.momentumBar}>
        <View style={styles.momentumCenter} />
        <View style={[
          styles.momentumIndicator,
          {
            left: `${normalized * 100}%`,
            backgroundColor: isHome ? COLORS.primary : COLORS.secondary,
          },
        ]} />
      </View>

      <Text style={styles.momentumLabel}>
        {isHome ? homeTeam : awayTeam} dominating ({absValue}%)
      </Text>
    </Card>
  );
}

interface ThreatIndicatorProps {
  team: 'home' | 'away';
  type: 'counter' | 'setpiece' | 'wing' | 'central';
  description: string;
  dangerLevel: number; // 1-10
}

export function ThreatIndicator({ team, type, description, dangerLevel }: ThreatIndicatorProps) {
  const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    counter: 'flash',
    setpiece: 'flag',
    wing: 'git-branch',
    central: 'radio-button-on',
  };

  const dangerColor = dangerLevel > 7 ? COLORS.error : dangerLevel > 4 ? COLORS.warning : COLORS.success;

  return (
    <View style={styles.threatRow}>
      <View style={[styles.threatIcon, { backgroundColor: dangerColor + '20' }]}>
        <Ionicons name={typeIcons[type]} size={16} color={dangerColor} />
      </View>
      <View style={styles.threatInfo}>
        <Text style={styles.threatType}>{type.toUpperCase()}</Text>
        <Text style={styles.threatDesc}>{description}</Text>
      </View>
      <View style={[styles.threatLevel, { backgroundColor: dangerColor }]}>
        <Text style={styles.threatLevelText}>{dangerLevel}</Text>
      </View>
    </View>
  );
}

interface StatsComparisonProps {
  homeTeam: string;
  awayTeam: string;
  stats: {
    label: string;
    home: number;
    away: number;
    higherIsBetter?: boolean;
  }[];
}

export function StatsComparison({ homeTeam, awayTeam, stats }: StatsComparisonProps) {
  return (
    <Card>
      <View style={styles.statsHeader}>
        <Text style={styles.statsTeamHome}>{homeTeam}</Text>
        <Text style={styles.statsTitle}>Stats</Text>
        <Text style={styles.statsTeamAway}>{awayTeam}</Text>
      </View>
      
      {stats.map((stat, index) => {
        const homeBetter = stat.higherIsBetter !== false 
          ? stat.home > stat.away 
          : stat.home < stat.away;
        const awayBetter = !homeBetter;

        return (
          <View key={index} style={styles.statRow}>
            <Text style={[styles.statHome, homeBetter && styles.statHighlight]}>
              {stat.home}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statAway, awayBetter && styles.statHighlight]}>
              {stat.away}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  possessionContainer: {
    marginBottom: 16,
  },
  possessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  possessionTitle: {
    fontSize: 12,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  possessionBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  possessionHome: {
    backgroundColor: COLORS.primary,
  },
  possessionAway: {
    backgroundColor: COLORS.secondary,
  },
  possessionValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  possValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  momentumCard: {
    marginBottom: 16,
  },
  momentumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  momentumTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  momentumTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  momentumTeam: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  momentumTeamActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  momentumBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    position: 'relative',
    marginBottom: 8,
  },
  momentumCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: COLORS.textDim,
  },
  momentumIndicator: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
  momentumLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  threatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  threatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threatInfo: {
    flex: 1,
  },
  threatType: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 1,
  },
  threatDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  threatLevel: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threatLevelText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.background,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTeamHome: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statsTitle: {
    fontSize: 12,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsTeamAway: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statHome: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'left',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    width: 80,
  },
  statAway: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  statHighlight: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
