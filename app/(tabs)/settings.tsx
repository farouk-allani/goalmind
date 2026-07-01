// GoalMind — Settings Screen

import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { useAIStore, useWalletStore } from '@/stores';

export default function SettingsScreen() {
  const { modelsLoaded } = useAIStore();
  const { wallet } = useWalletStore();

  const sections = [
    {
      title: 'AI Models',
      items: [
        { label: 'LLM Status', value: modelsLoaded ? 'Loaded' : 'Not Loaded', icon: 'cpu' as const },
        { label: 'Model Size', value: '~1.5GB', icon: 'hardware-chip' as const },
        { label: 'Inference', value: 'On-Device (QVAC)', icon: 'phone-portrait' as const },
        { label: 'Data Privacy', value: 'No Cloud', icon: 'shield-checkmark' as const },
      ],
    },
    {
      title: 'Wallet',
      items: [
        { label: 'Status', value: wallet.initialized ? 'Connected' : 'Not Connected', icon: 'wallet' as const },
        { label: 'Chain', value: wallet.chain.toUpperCase(), icon: 'link' as const },
        { label: 'Custody', value: 'Self-Custodial (WDK)', icon: 'key' as const },
      ],
    },
    {
      title: 'About',
      items: [
        { label: 'Version', value: '1.0.0', icon: 'information-circle' as const },
        { label: 'Built For', value: 'Tether Developers Cup', icon: 'trophy' as const },
        { label: 'License', value: 'MIT', icon: 'document-text' as const },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <View
                  key={item.label}
                  style={[
                    styles.settingItem,
                    index < section.items.length - 1 && styles.settingItemBorder,
                  ]}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name={item.icon} size={18} color={COLORS.textDim} />
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.settingValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Tech Stack */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tech Stack</Text>
          <View style={styles.techStack}>
            {[
              { name: 'QVAC SDK', desc: 'On-Device AI', color: COLORS.primary },
              { name: 'WDK', desc: 'Self-Custodial Wallet', color: COLORS.secondary },
              { name: 'Expo', desc: 'Mobile Framework', color: COLORS.accent },
              { name: 'React Native', desc: 'Cross-Platform', color: COLORS.success },
            ].map((tech) => (
              <View key={tech.name} style={styles.techItem}>
                <View style={[styles.techDot, { backgroundColor: tech.color }]} />
                <View>
                  <Text style={styles.techName}>{tech.name}</Text>
                  <Text style={styles.techDesc}>{tech.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            GoalMind — AI Football Companion
          </Text>
          <Text style={styles.footerSubtext}>
            Built for the Tether Developers Cup 2026
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  settingValue: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  techStack: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  techItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  techDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  techName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  techDesc: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 4,
  },
});
