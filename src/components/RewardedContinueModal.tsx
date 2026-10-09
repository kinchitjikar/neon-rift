import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adManager } from "../utils/adManager";
import { ADS_CONFIG } from "../config/ads";
import { COLORS, FONTS } from "../config/theme";

interface RewardedContinueModalProps {
  score: number;
  levelId: number;
  continuesUsed: number;
  onContinueGame: () => void;
  onDecline: () => void;
}

export const RewardedContinueModal: React.FC<RewardedContinueModalProps> = ({
  score,
  levelId,
  continuesUsed,
  onContinueGame,
  onDecline,
}) => {
  const insets = useSafeAreaInsets();
  const [isLoadingAd, setIsLoadingAd] = useState(false);

  const handleWatchAd = () => {
    setIsLoadingAd(true);
    adManager.showRewardedAd(
      () => {
        setIsLoadingAd(false);
        onContinueGame();
      },
      () => {
        setIsLoadingAd(false);
        onDecline();
      },
      (reason: string) => {
        setIsLoadingAd(false);
        Alert.alert(
          "Ad Unavailable",
          reason ||
            "Unable to load reward video. Please check your internet connection or disable Private DNS / AdGuard.",
          [{ text: "OK", onPress: onDecline }]
        );
      }
    );
  };

  const continuesRemaining =
    ADS_CONFIG.MAX_CONTINUES_PER_SESSION - continuesUsed;

  return (
    <View
      style={[
        styles.overlay,
        {
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom + 20, 36),
        },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.warningTag}>⚠️ SECTOR DANGER</Text>
        <Text style={styles.title}>Out of Lives!</Text>
        <Text style={styles.subtitle}>
          Continue Sector {levelId} without losing progress?
        </Text>

        <TouchableOpacity onPress={handleWatchAd} style={styles.rewardBox}>
          <Text style={styles.rewardIcon}>❤️</Text>
          <View>
            <Text style={styles.rewardTitle}>+1 EXTRA LIFE (AD)</Text>
            <Text style={styles.rewardDesc}>
              Keep current score: {score.toLocaleString()} pts
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.continuesTag}>
          Ad Continues Left: {continuesRemaining}/
          {ADS_CONFIG.MAX_CONTINUES_PER_SESSION}
        </Text>

        {/* <TouchableOpacity
          style={styles.watchAdBtn}
          onPress={handleWatchAd}
          disabled={isLoadingAd}
          activeOpacity={0.85}
        >
          {isLoadingAd ? (
            <ActivityIndicator color={COLORS.base} />
          ) : (
            <Text style={styles.watchAdBtnText}>
              🎬 WATCH AD FOR EXTRA LIFE ▶
            </Text>
          )}
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.declineBtn}
          onPress={onDecline}
          disabled={isLoadingAd}
          activeOpacity={0.7}
        >
          <Text style={styles.declineBtnText}>No thanks, restart sector</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11, 16, 32, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 100,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
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
  },
  subtitle: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniMedium,
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  rewardBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    width: "100%",
    marginBottom: 10,
  },
  rewardIcon: {
    fontSize: 28,
  },
  rewardTitle: {
    color: COLORS.gold,
    fontFamily: FONTS.orbitronBold,
    fontSize: 13,
  },
  rewardDesc: {
    color: COLORS.text,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 12,
  },
  continuesTag: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 11,
    marginBottom: 16,
  },
  watchAdBtn: {
    backgroundColor: COLORS.accent,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.4,
  },
  watchAdBtnText: {
    color: COLORS.base,
    fontFamily: FONTS.orbitronBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  declineBtn: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  declineBtnText: {
    color: COLORS.muted,
    fontFamily: FONTS.rajdhaniSemiBold,
    fontSize: 13,
  },
});
