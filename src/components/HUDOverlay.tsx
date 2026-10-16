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
    <View style={styles.container} pointerEvents="box-none">
      {/* Top Header Frame: Navigation, Sector Title & Controls */}
      <View
        style={[
          styles.topControlsWrapper,
          {
            paddingTop: Math.max(insets.top, 10),
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.topHeaderFrame}>
          <View style={styles.leftMeta}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.btnText}>{soundEnabled ? "🔊" : "🔇"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onPauseToggle}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.btnText}>
                {gameStatus === "PAUSED" ? "▶" : "❚❚"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Glass Sci-Fi Score Card: Target, Prominent Score & Combo Pill */}
      <View
        style={[
          styles.bottomScoreCardWrapper,
          {
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.scoreCardFrame} pointerEvents="none">
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
    justifyContent: "space-between",
  },
  topControlsWrapper: {
    paddingHorizontal: 12,
  },
  topHeaderFrame: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(11, 16, 32, 0.88)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
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
  bottomScoreCardWrapper: {
    paddingHorizontal: 12,
  },
  scoreCardFrame: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(11, 16, 32, 0.94)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  targetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 85,
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
    fontSize: 13,
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
