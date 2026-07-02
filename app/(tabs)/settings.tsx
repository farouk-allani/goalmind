// GoalMind — Settings Screen (Enhanced)
// App info, model status, wallet info, tech stack.

import { View, Text, ScrollView, Pressable, Alert, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { useAIStore, useWalletStore } from '@/stores';
import { useWallet } from '@/hooks/useWallet';
import { config } from '@/lib/config';
import { Card } from '@/components/ui';

export default function SettingsScreen() {
  const { modelsLoaded } = useAIStore();
  const { reset } = useWallet();

  const sections = [
    {
      title: 'AI Models',
      items: [
        { label: 'LLM Status', value: modelsLoaded ? 'Loaded' : 'Not Loaded', icon: 'hardware-chip' as const, color: modelsLoaded ? COLORS.success : COLORS.warning },
        { label: 'Model', value: config.qvac.llm, icon: 'hardware-chip' as const, color: COLORS.primary },
        { label: 'Inference', value: 'On-Device (QVAC)', icon: 'phone-portrait' as const, color: COLORS.secondary },
        { label: 'Data Privacy', value: 'No Cloud', icon: 'shield-checkmark' as const, color: COLORS.success },
      ],
    },
    {
      title: 'Wallet',
      items: [
        { label: 'Custody', value: 'Self-Custodial (WDK)', icon: 'key' as const, color: COLORS.accent },
        { label: 'Supported Chains', value: 'ETH, Polygon, Arb, OP', icon: 'link' as const, color: COLORS.textMuted },
      ],
    },
    {
      title: 'App Info',
      items: [
        { label: 'Version', value: config.appVersion, icon: 'information-circle' as const, color: COLORS.textMuted },
        { label: 'Built For', value: 'Tether Developers Cup 2026', icon: 'trophy' as const, color: COLORS.accent },
        { label: 'License', value: 'MIT', icon: 'document-text' as const, color: COLORS.textMuted },
        { label: 'Author', value: 'Farouk Allani', icon: 'person' as const, color: COLORS.primary },
      ],
    },
  ];

  const handleReset = () => {
    Alert.alert(
      'Reset Wallet',
      'This will remove your wallet from this device. Make sure you have your seed phrase backed up.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => reset() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={require('@/assets/brand/logo-mark.jpg')} style={{ width: 28, height: 28, borderRadius: 6 }} />
          <Text style={styles.title}>Settings</Text>
        </View>
        <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700', marginTop: 2 }}>TETHER DEVELOPERS CUP 2026</Text>
      </View>

      {/* Showcase the premium design with app mockup */}
      <View style={styles.mockupContainer}>
        <Image 
          source={require('@/assets/brand/app-mockup.jpg')} 
          style={styles.mockupImage} 
          resizeMode="cover" 
        />
        <View style={styles.mockupOverlay}>
          <Text style={styles.mockupLabel}>Tournament-grade design</Text>
        </View>
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
                    <Ionicons name={item.icon} size={18} color={item.color} />
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
              { name: 'QVAC SDK', desc: 'On-Device AI (Llama 3.2 1B)', color: COLORS.primary },
              { name: 'WDK', desc: 'Self-Custodial Wallet', color: COLORS.secondary },
              { name: 'Expo', desc: 'Mobile Framework', color: COLORS.accent },
              { name: 'React Native', desc: 'Cross-Platform UI', color: COLORS.success },
              { name: 'Zustand', desc: 'State Management', color: COLORS.warning },
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

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {[
              { icon: 'camera', label: 'Camera Analysis', desc: 'Point at match' },
              { icon: 'mic', label: 'AI Commentary', desc: '6 languages' },
              { icon: 'trending-up', label: 'Predictions', desc: 'Elo + Poisson' },
              { icon: 'wallet', label: 'Fan Wallet', desc: 'Multi-chain' },
              { icon: 'airplane', label: 'Offline Mode', desc: 'No internet needed' },
              { icon: 'shield-checkmark', label: 'Privacy First', desc: 'On-device only' },
            ].map((feature) => (
              <View key={feature.label} style={styles.featureItem}>
                <Ionicons name={feature.icon as any} size={24} color={COLORS.primary} />
                <Text style={styles.featureLabel}>{feature.label}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <Pressable style={styles.dangerButton} onPress={handleReset}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={styles.dangerText}>Reset Wallet</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>GoalMind — AI Football Companion</Text>
          <Text style={styles.footerSubtext}>Built for the Tether Developers Cup 2026</Text>
          <Text style={styles.footerSubtext}>by Farouk Allani</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 60 },
  header: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },
  mockupContainer: {
    marginHorizontal: -20,
    marginBottom: 24,
    height: 168,
    overflow: 'hidden',
    position: 'relative',
  },
  mockupImage: {
    width: '100%',
    height: '100%',
  },
  mockupOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,10,10,0.75)',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  mockupLabel: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  sectionCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingLabel: { fontSize: 14, color: COLORS.text },
  settingValue: { fontSize: 13, color: COLORS.textMuted, maxWidth: '50%', textAlign: 'right' },
  techStack: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  techItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  techDot: { width: 10, height: 10, borderRadius: 5 },
  techName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  techDesc: { fontSize: 12, color: COLORS.textDim },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureItem: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, width: '47%', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border },
  featureLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  featureDesc: { fontSize: 11, color: COLORS.textDim },
  dangerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.error + '10', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.error + '30' },
  dangerText: { fontSize: 14, color: COLORS.error, fontWeight: '600' },
  footer: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  footerText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  footerSubtext: { fontSize: 12, color: COLORS.textDim },
});
