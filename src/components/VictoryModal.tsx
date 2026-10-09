import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../config/theme';

interface VictoryModalProps {
  score: number;
  levelId: number;
  onNextLevel: () => void;
  onMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  score,
  levelId,
  onNextLevel,
  onMenu,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.overlay, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom + 20, 36) }]}>
      <View style={styles.card}>
        <Text style={styles.subtitle}>SECTOR CLEARED</Text>
        <Text style={styles.title}>Sector {levelId} Complete!</Text>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={onNextLevel} activeOpacity={0.85}>
          <Text style={styles.nextText}>Next Sector ▶</Text>
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
  subtitle: {
    color: COLORS.green,
    fontFamily: FONTS.orbitronBold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONTS.orbitronBlack,
    fontSize: 22,
    letterSpacing: 0.5,
    marginBottom: 16,
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
  nextBtn: {
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
  nextText: {
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
