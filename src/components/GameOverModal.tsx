import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../config/theme';

interface GameOverModalProps {
  score: number;
  highScore: number;
  levelId: number;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  levelId,
  onRestart,
  onMenu,
}) => {
  const insets = useSafeAreaInsets();
  const isNewRecord = score > highScore && score > 0;

  return (
    <View style={[styles.overlay, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom + 20, 36) }]}>
      <View style={styles.card}>
        <Text style={styles.warningTag}>SYSTEM CRITICAL</Text>
        <Text style={styles.title}>Out of Lives</Text>
        <Text style={styles.subtitle}>Sector {levelId} Failed</Text>

        {isNewRecord && (
          <View style={styles.recordBadge}>
            <Text style={styles.recordText}>🎉 NEW HIGH SCORE!</Text>
          </View>
        )}

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>FINAL SCORE</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.restartBtn} onPress={onRestart} activeOpacity={0.85}>
          <Text style={styles.restartText}>Try Sector Again ▶</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={onMenu} activeOpacity={0.7}>
          <Text style={styles.menuText}>Back to Main Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 16, 32, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  warningTag: {
    color: COLORS.pink,
    fontFamily: FONTS.orbitronBold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONTS.orbitronBlack,
    fontSize: 24,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniMedium,
    fontSize: 14,
    marginBottom: 20,
  },
  recordBadge: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: COLORS.gold,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  recordText: {
    color: COLORS.gold,
    fontFamily: FONTS.orbitronBold,
    fontSize: 11,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  scoreLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  scoreValue: {
    color: COLORS.accent,
    fontFamily: FONTS.orbitronBold,
    fontSize: 32,
  },
  restartBtn: {
    backgroundColor: COLORS.accent,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.4,
  },
  restartText: {
    color: COLORS.base,
    fontFamily: FONTS.orbitronBold,
    fontSize: 14,
  },
  menuBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  menuText: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 13,
  },
});
