import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GameStatus, LevelConfig, PowerUpType } from "../types/game";
import { COLORS, FONTS } from "../config/theme";

interface HUDOverlayProps {
  level: LevelConfig;
  score: number;
  highScore: number;
  coins: number;
  lives: number;
  combo: number;
  gameStatus: GameStatus;
  activePowerUp?: PowerUpType;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPauseToggle: () => void;
  onClose: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  level,
  score,
  highScore,
  coins,
  lives,
  combo,
  gameStatus,
  activePowerUp,
  soundEnabled,
  onToggleSound,
  onPauseToggle,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const totalBricks = level.bricks.length;
  const destroyedBricks = Math.min(totalBricks, Math.floor(score / 150));

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Top Glass Sci-Fi Header Frame */}
      <View style={styles.topHeaderFrame}>
        {/* Row 1: Navigation, Sector Title & Controls */}
        <View style={styles.headerTopRow}>
          <View style={styles.leftMeta}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✖</Text>
            </TouchableOpacity>
            <View style={styles.sectorBadge}>
              <Text style={styles.sectorText} numberOfLines={1}>
                {level.name.toUpperCase()} · {level.planetName}
              </Text>
            </View>
          </View>

          <View style={styles.rightControls}>
            <View style={styles.livesRow}>
              {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                <Text key={i} style={styles.heartIcon}>
                  ♥
                </Text>
              ))}
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onToggleSound}
              activeOpacity={0.7}
            >
              <Text style={styles.btnText}>{soundEnabled ? "🔊" : "🔇"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onPauseToggle}
              activeOpacity={0.7}
            >
              <Text style={styles.btnText}>
                {gameStatus === "PAUSED" ? "▶" : "❚❚"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Target Badge, Prominent Score & Combo Pill */}
        <View style={styles.statsRow}>
          <View style={styles.targetBadge}>
            <Text style={styles.targetLabel}>TARGET</Text>
            <Text style={styles.targetValue}>
              {destroyedBricks}/{totalBricks}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
          </View>

          <View style={styles.rightStatContainer}>
            {combo > 1 ? (
              <View style={styles.comboPill}>
                <Text style={styles.comboText}>🔥 {combo}X</Text>
              </View>
            ) : (
              <View style={styles.comboPlaceholder} />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 12,
  },
  topHeaderFrame: {
    backgroundColor: "rgba(11, 16, 32, 0.94)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 6,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  closeBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  closeBtnText: {
    color: COLORS.pink,
    fontSize: 11,
    fontWeight: "800",
  },
  sectorBadge: {
    flex: 1,
  },
  sectorText: {
    color: COLORS.accent,
    fontFamily: FONTS.orbitronBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  livesRow: {
    flexDirection: "row",
    marginRight: 4,
  },
  heartIcon: {
    color: COLORS.pink,
    fontSize: 13,
    marginLeft: 2,
  },
  iconBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  btnText: {
    color: COLORS.text,
    fontSize: 11,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(3, 7, 18, 0.60)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  targetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 90,
  },
  targetLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  targetValue: {
    color: COLORS.text,
    fontFamily: FONTS.orbitronBold,
    fontSize: 11,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
    flex: 1,
  },
  scoreLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  scoreValue: {
    color: COLORS.gold,
    fontFamily: FONTS.orbitronBold,
    fontSize: 12,
  },
  rightStatContainer: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  comboPill: {
    backgroundColor: "rgba(244, 114, 182, 0.20)",
    borderWidth: 1,
    borderColor: "rgba(244, 114, 182, 0.40)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  comboText: {
    color: COLORS.pink,
    fontFamily: FONTS.orbitronBold,
    fontSize: 10,
  },
  comboPlaceholder: {
    width: 20,
  },
});
