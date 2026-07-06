// GoalMind — Live Commentary Component
// Real-time AI commentary generation with text-to-speech.

import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { Card, Button, Pill } from '@/components/ui';
import { useAI } from '@/hooks/useAI';

interface CommentaryEvent {
  minute: number;
  type: string;
  description: string;
}

interface LiveCommentaryProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  events?: CommentaryEvent[];
}

export function LiveCommentary({ matchId, homeTeam, awayTeam, events = [] }: LiveCommentaryProps) {
  // Text commentary only needs the LLM (already pre-warmed from Home), so load
  // it on mount and let the buttons enable as soon as it's ready. `speak`
  // lazy-loads the TTS model on first tap, so we don't block on it here.
  const { isReady, loading, analyze, speak } = useAI({ autoLoad: true, models: ['llm'] });
  const [commentary, setCommentary] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'ar', name: 'العربية' },
  ];

  const generateCommentary = useCallback(async (event: CommentaryEvent) => {
    if (!isReady || isGenerating) return;

    setIsGenerating(true);
    try {
      const systemPrompt = `You are an exciting football commentator. Generate short, energetic commentary for match events.
Keep it to 1-2 sentences. Be vivid and dramatic but not cheesy.
${selectedLanguage !== 'en' ? `Respond in ${languages.find(l => l.code === selectedLanguage)?.name}.` : ''}`;

      const prompt = `Match: ${homeTeam} vs ${awayTeam}
Minute: ${event.minute}'
Event: ${event.type}
Description: ${event.description}

Generate commentary for this moment.`;

      const result = await analyze(prompt, systemPrompt);
      setCommentary((prev) => [...prev, `[${event.minute}'] ${result}`]);
    } catch (error) {
      console.error('Commentary generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [isReady, isGenerating, homeTeam, awayTeam, selectedLanguage]);

  const speakCommentary = useCallback(async (text: string, index: number) => {
    if (speakingIndex !== null) return;

    setSpeakingIndex(index);
    try {
      await speak(text);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    } finally {
      setSpeakingIndex(null);
    }
  }, [speak, speakingIndex]);

  // Auto-generate commentary for new events
  useEffect(() => {
    if (events.length > 0 && isReady) {
      const latestEvent = events[events.length - 1];
      generateCommentary(latestEvent);
    }
  }, [events, isReady]);

  return (
    <Card style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="mic" size={20} color={COLORS.accent} />
          <Text style={styles.title}>AI Commentary</Text>
        </View>
        <View style={styles.languageSelector}>
          {languages.slice(0, 3).map((lang) => (
            <Pill
              key={lang.code}
              label={lang.code.toUpperCase()}
              variant={selectedLanguage === lang.code ? 'active' : 'inactive'}
              onPress={() => setSelectedLanguage(lang.code)}
            />
          ))}
        </View>
      </View>

      {/* Commentary Feed */}
      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        {commentary.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={32} color={COLORS.textDim} />
            <Text style={styles.emptyText}>
              Start a match to generate live AI commentary
            </Text>
            <Text style={styles.emptySubtext}>
              Works offline in stadiums — no connectivity needed
            </Text>
          </View>
        ) : (
          commentary.map((line, index) => (
            <View key={index} style={styles.commentaryLine}>
              <Text style={styles.commentaryText}>{line}</Text>
              <Pressable
                style={styles.speakButton}
                onPress={() => speakCommentary(line, index)}
                disabled={speakingIndex !== null}
              >
                {speakingIndex === index ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons name="volume-medium-outline" size={16} color={COLORS.primary} />
                )}
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Status */}
      {(loading || isGenerating) && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {loading ? 'Loading AI models...' : 'Generating commentary...'}
          </Text>
        </View>
      )}

      {/* Manual trigger for demo */}
      <View style={styles.actions}>
        <Button
          title="Demo: Goal!"
          onPress={() => generateCommentary({
            minute: 67,
            type: 'goal',
            description: `${homeTeam} scores! Brilliant finish from outside the box.`,
          })}
          variant="outline"
          size="sm"
          icon="football"
          loading={isGenerating}
          disabled={!isReady}
        />
        <Button
          title="Demo: Save"
          onPress={() => generateCommentary({
            minute: 45,
            type: 'save',
            description: `Incredible save by the goalkeeper! Finger-tip save to deny a certain goal.`,
          })}
          variant="outline"
          size="sm"
          icon="hand-left"
          loading={isGenerating}
          disabled={!isReady}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  feed: {
    maxHeight: 200,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textDim,
    textAlign: 'center',
  },
  commentaryLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  commentaryText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  speakButton: {
    padding: 4,
  },
  statusBar: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
});
