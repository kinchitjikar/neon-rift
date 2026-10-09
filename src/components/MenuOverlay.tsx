import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { generateLevel } from "../game/levels";
import { FONTS } from "../config/theme";
import { storageManager } from "../utils/storage";

interface MenuOverlayProps {
  onStartGame: (levelId: number) => void;
  highScore: number;
  unlockedLevel?: number;
}

// Neon Midnight palette: one dark base, one accent, everything else is quiet.
const COLORS = {
  base: "#0B1020",
  surface: "rgba(255, 255, 255, 0.05)",
  line: "rgba(255, 255, 255, 0.10)",
  text: "#F8FAFC",
  muted: "rgba(248, 250, 252, 0.55)",
  accent: "#22D3EE",
  violet: "#8B5CF6",
  pink: "#F472B6",
};

export const MenuOverlay: React.FC<MenuOverlayProps> = ({
  onStartGame,
  highScore,
  unlockedLevel = 1,
}) => {
  const insets = useSafeAreaInsets();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const cachedProgress = storageManager.getCachedProgress();
  const effectiveUnlocked = Math.max(
    unlockedLevel,
    cachedProgress.unlockedLevel,
    1
  );

  // Generate 50 Sector items for selector grid
  const allSectors = Array.from({ length: 50 }, (_, i) => {
    const levelId = i + 1;
    const levelConfig = generateLevel(levelId);
    return {
      id: levelId,
      name: levelConfig.name,
      planetName: levelConfig.planetName,
      theme: levelConfig.themeColor,
      brickCount: levelConfig.bricks.length,
    };
  });

  const progressPct = Math.min(100, (effectiveUnlocked / 50) * 100);

  return (
    <ImageBackground
      source={require("../../assets/space_bg_1.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, 36),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.headerBox}>
          <Text style={styles.title}>ORBIT BREAKER</Text>
          <Text style={styles.tagline}>Space Brick Breaker Arcade · 50 Sectors</Text>
        </View>

        {!showHowToPlay ? (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom + 50, 70) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats card */}
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statLabel}>Best score</Text>
                  <Text style={styles.statValue}>
                    {highScore.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statRight}>
                  <Text style={styles.statLabel}>Sectors</Text>
                  <Text style={styles.statValue}>
                    {effectiveUnlocked}
                    <Text style={styles.statValueDim}>/50</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progressPct}%` }]}
                />
              </View>
            </View>

            {/* How to play trigger */}
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => setShowHowToPlay(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.linkBtnText}>How to play & power-ups</Text>
            </TouchableOpacity>

            {/* Sector grid */}
            <Text style={styles.sectionHeader}>Choose a sector</Text>

            <View style={styles.gridContainer}>
              {allSectors.map((sec) => {
                const isUnlocked = sec.id <= effectiveUnlocked;
                const isCurrent = sec.id === effectiveUnlocked;
                return (
                  <TouchableOpacity
                    key={sec.id}
                    style={[
                      styles.sectorTile,
                      isCurrent && styles.sectorTileCurrent,
                      !isUnlocked && styles.sectorTileLocked,
                    ]}
                    onPress={() => {
                      if (isUnlocked) {
                        onStartGame(sec.id);
                      }
                    }}
                    activeOpacity={isUnlocked ? 0.7 : 1.0}
                  >
                    <Text
                      style={[
                        styles.tileNum,
                        { color: isUnlocked ? sec.theme : COLORS.muted },
                      ]}
                    >
                      {isUnlocked ? sec.id : "🔒"}
                    </Text>
                    <Text style={styles.tilePlanet} numberOfLines={1}>
                      {isUnlocked ? sec.planetName : `Sector ${sec.id}`}
                    </Text>
                    <Text style={styles.tileBricks}>
                      {isUnlocked ? `${sec.brickCount} bricks` : "Locked"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          /* How to Play View */
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionHeader}>How to play</Text>
            <Text style={styles.guideText}>
              • Drag your finger anywhere on screen to steer your paddle.
              {"\n"}• Bounce the energy sphere off your paddle to shatter the
              space bricks.
              {"\n"}• Collect falling 🪙 gold coins to boost your score.
              {"\n"}• Avoid red bomb bricks 💥. They set off shockwaves.
            </Text>

            <Text style={[styles.sectionHeader, { marginTop: 24 }]}>
              Power-ups
            </Text>
            <View style={styles.powerUpLegend}>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#22D3EE" }]}
                />
                <View style={styles.legendTextWrap}>
                  <Text style={styles.legendTitle}>⚡ Wide paddle</Text>
                  <Text style={styles.legendDesc}>
                    Expands your paddle for maximum defense.
                  </Text>
                </View>
              </View>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#FACC15" }]}
                />
                <View style={styles.legendTextWrap}>
                  <Text style={styles.legendTitle}>🎾 Multi-ball</Text>
                  <Text style={styles.legendDesc}>
                    Spawns 2 extra high-speed spheres.
                  </Text>
                </View>
              </View>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#34D399" }]}
                />
                <View style={styles.legendTextWrap}>
                  <Text style={styles.legendTitle}>🛡 Energy shield</Text>
                  <Text style={styles.legendDesc}>
                    A force field along the bottom saves the ball once.
                  </Text>
                </View>
              </View>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: COLORS.pink }]}
                />
                <View style={styles.legendTextWrap}>
                  <Text style={styles.legendTitle}>♥ Extra life</Text>
                  <Text style={styles.legendDesc}>
                    Grants +1 heart immediately.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowHowToPlay(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Back to sectors</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.base,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(11, 16, 32, 0.88)",
    paddingHorizontal: 20,
  },

  /* Header */
  headerBox: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONTS.orbitronBlack,
    fontSize: 28,
    letterSpacing: 1,
    textShadowColor: COLORS.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  tagline: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniMedium,
    fontSize: 14,
    marginTop: 6,
  },
  content: {
    paddingBottom: 40,
  },

  /* Stats */
  statsCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  statRight: {
    alignItems: "flex-end",
  },
  statLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 13,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.text,
    fontFamily: FONTS.orbitronBold,
    fontSize: 22,
  },
  statValueDim: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 16,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.line,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },

  /* Buttons */
  primaryBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.5,
    elevation: 6,
  },
  primaryBtnText: {
    color: COLORS.base,
    fontFamily: FONTS.orbitronBold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  linkBtn: {
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  linkBtnText: {
    color: COLORS.accent,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 14,
  },

  /* Sector grid */
  sectionHeader: {
    color: COLORS.text,
    fontFamily: FONTS.orbitronBold,
    fontSize: 15,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
  },
  sectorTile: {
    width: "31%",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  sectorTileCurrent: {
    borderColor: COLORS.accent,
    backgroundColor: "rgba(34, 211, 238, 0.10)",
  },
  sectorTileLocked: {
    opacity: 0.4,
  },
  tileNum: {
    fontFamily: FONTS.orbitronBold,
    fontSize: 18,
  },
  tilePlanet: {
    color: COLORS.text,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 11,
    marginTop: 4,
  },
  tileBricks: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  /* How to play */
  guideText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
    borderRadius: 16,
  },
  powerUpLegend: {
    gap: 10,
    marginBottom: 24,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    borderRadius: 14,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  legendTextWrap: {
    flex: 1,
  },
  legendTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  legendDesc: {
    color: COLORS.muted,
    fontSize: 12,
  },
});
