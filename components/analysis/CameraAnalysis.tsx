// GoalMind — Camera Integration for Live Match Analysis
// Captures a frame with expo-camera and runs it through the on-device
// QVAC vision model (SmolVLM2 500M multimodal). No cloud, no API keys.

import { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { analyzeImage, isModelLoaded } from '@/lib/ai/models';

interface CameraAnalysisProps {
  onCapture?: (uri: string) => void;
  onAnalyze?: (analysis: string) => void;
}

const VISION_PROMPT = `You are a football tactical analyst watching a match. Describe what you see on the pitch: the phase of play, team shapes/formations if visible, player positioning, and one tactical observation. If this is not a football scene, say what it actually shows instead. Be concise (3-4 sentences).`;

export function CameraAnalysis({ onCapture, onAnalyze }: CameraAnalysisProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [downloadPct, setDownloadPct] = useState<number | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const toggleFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        onCapture?.(photo.uri);

        // QVAC attachments take a filesystem path, not a file:// URI.
        const imagePath = photo.uri.replace(/^file:\/\//, '');

        const needsDownload = !isModelLoaded('vision');
        if (needsDownload) setDownloadPct(0);

        const analysis = await analyzeImage(imagePath, VISION_PROMPT, (p) => {
          setDownloadPct(Math.round(p.percentage));
        });

        setDownloadPct(null);
        onAnalyze?.(analysis);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Camera analysis failed:', error);
      setDownloadPct(null);
      onAnalyze?.(
        `Vision analysis failed: ${error instanceof Error ? error.message : 'unknown error'}. ` +
          'Make sure you are running a native build on a physical device with enough free storage for the vision model (~600 MB).'
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, onCapture, onAnalyze]);

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={48} color={COLORS.textDim} />
        <Text style={styles.title}>Camera Access Required</Text>
        <Text style={styles.subtitle}>
          GoalMind needs camera access to analyze live matches
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.statusText}>LIVE</Text>
            </View>
            <Text style={styles.cameraTitle}>Match Analysis</Text>
          </View>

          {/* Center guide */}
          <View style={styles.centerGuide}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
            <Text style={styles.guideText}>Point at match</Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomBar}>
            <Pressable style={styles.flipButton} onPress={toggleFacing}>
              <Ionicons name="camera-reverse" size={24} color={COLORS.text} />
            </Pressable>

            <Pressable
              style={[styles.captureButton, isAnalyzing && styles.captureButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                captureAndAnalyze();
              }}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Text style={styles.captureText}>Analyzing on-device...</Text>
              ) : (
                <Ionicons name="scan" size={32} color={COLORS.background} />
              )}
            </Pressable>

            <View style={styles.placeholder} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  cameraTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  centerGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: COLORS.primary,
  },
  cornerTR: {
    position: 'absolute',
    top: '30%',
    right: '20%',
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.primary,
  },
  cornerBL: {
    position: 'absolute',
    bottom: '30%',
    left: '20%',
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: COLORS.primary,
  },
  cornerBR: {
    position: 'absolute',
    bottom: '30%',
    right: '20%',
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.primary,
  },
  guideText: {
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.text,
  },
  captureButtonActive: {
    backgroundColor: COLORS.warning,
  },
  captureText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.background,
    textAlign: 'center',
  },
  placeholder: {
    width: 48,
    height: 48,
  },
  text: {
    fontSize: 16,
    color: COLORS.text,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.background,
  },
});
