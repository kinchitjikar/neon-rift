import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { GameStatus, LevelConfig, PowerUpType } from "./src/types/game";
import { generateLevel } from "./src/game/levels";
import { GameCanvas } from "./src/components/GameCanvas";
import { HUDOverlay } from "./src/components/HUDOverlay";
import { MenuOverlay } from "./src/components/MenuOverlay";
import { GameOverModal } from "./src/components/GameOverModal";
import { VictoryModal } from "./src/components/VictoryModal";
import { RewardedContinueModal } from "./src/components/RewardedContinueModal";
import { soundManager } from "./src/audio/soundManager";
import { adManager } from "./src/utils/adManager";
import { storageManager } from "./src/utils/storage";
import { ADS_CONFIG } from "./src/config/ads";
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
} from "@expo-google-fonts/orbitron";
import {
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from "@expo-google-fonts/rajdhani";
import { FONTS } from "./src/config/theme";
import {
  getRandomWallpaperIndex,
  getWallpaperByIndex,
} from "./src/config/wallpapers";

// Keep the native splash screen visible until we explicitly hide it
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });
  const [gameStatus, setGameStatus] = useState<GameStatus>("MENU");
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(generateLevel(1));
  const [gameSessionId, setGameSessionId] = useState(0);
  const [wallpaperIndex, setWallpaperIndex] = useState<number>(() =>
    getRandomWallpaperIndex()
  );

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(12500);
  const [coins, setCoins] = useState(1100);
  const [lives, setLives] = useState(1);
  const [combo, setCombo] = useState(0);
  const [continuesUsed, setContinuesUsed] = useState(0);
  const [showRewardedModal, setShowRewardedModal] = useState(false);

  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | undefined>(
    undefined
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    adManager.init();
    storageManager.loadProgress().then((progress) => {
      setUnlockedLevel(progress.unlockedLevel);
      setHighScore(progress.highScore);
      setCoins(progress.coins);
      setSoundEnabled(progress.soundEnabled);
      soundManager.setSoundEnabled(progress.soundEnabled);
    });
  }, []);

  const handleStartGame = (levelId: number) => {
    // Security check: Never allow access to locked sectors
    if (levelId > unlockedLevel) {
      return;
    }
    setIsReplaying(levelId < unlockedLevel);
    setWallpaperIndex((prev) => getRandomWallpaperIndex(prev));
    const config = generateLevel(levelId);
    setCurrentLevelId(levelId);
    setLevelConfig(config);
    setGameSessionId((prev) => prev + 1);
    setScore(0);
    setLives(1);
    setCombo(0);
    setContinuesUsed(0);
    setShowRewardedModal(false);
    setActivePowerUp(undefined);
    setGameStatus("PLAYING");
  };

  const handleScoreChange = (newScore: number, newCombo: number) => {
    setScore(newScore);
    setCombo(newCombo);
    if (newScore > highScore) {
      setHighScore(newScore);
      storageManager.saveHighScore(newScore);
    }
  };

  const handleRewardCoins = (amount: number) => {
    setCoins((prev) => {
      const updated = prev + amount;
      storageManager.saveCoins(updated);
      return updated;
    });
  };

  const handleLifeChange = (newLives: number) => {
    setLives(Math.max(0, newLives));
  };

  const handleGameOver = () => {
    if (continuesUsed < ADS_CONFIG.MAX_CONTINUES_PER_SESSION) {
      setGameStatus("PAUSED");
      setShowRewardedModal(true);
    } else {
      setShowRewardedModal(false);
      adManager.showInterstitialIfEligible();
      setGameStatus("GAMEOVER");
    }
  };

  const handleAdRewardedSuccess = () => {
    if (continuesUsed < ADS_CONFIG.MAX_CONTINUES_PER_SESSION) {
      setLives(1);
      setContinuesUsed((prev) =>
        Math.min(ADS_CONFIG.MAX_CONTINUES_PER_SESSION, prev + 1)
      );
      setShowRewardedModal(false);
      setGameStatus("PLAYING");
    } else {
      setShowRewardedModal(false);
      adManager.showInterstitialIfEligible();
      setGameStatus("GAMEOVER");
    }
  };

  const handleAdRewardedDecline = () => {
    setShowRewardedModal(false);
    adManager.showInterstitialIfEligible();
    setGameStatus("GAMEOVER");
  };

  const handleVictory = () => {
    setGameStatus("VICTORY");
    const nextUnlocked = Math.min(
      50,
      Math.max(unlockedLevel, currentLevelId + 1)
    );
    setUnlockedLevel(nextUnlocked);
    storageManager.saveUnlockedLevel(nextUnlocked);
  };

  const handleNextLevel = () => {
    const nextId = currentLevelId + 1;
    if (nextId > 50) {
      setGameStatus("MENU");
      return;
    }
    const nextUnlocked = Math.min(50, Math.max(unlockedLevel, nextId));
    setUnlockedLevel(nextUnlocked);
    storageManager.saveUnlockedLevel(nextUnlocked);
    handleStartGame(nextId);
  };

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundManager.setSoundEnabled(nextState);
    storageManager.saveSoundEnabled(nextState);
  };

  const handlePauseToggle = () => {
    if (gameStatus === "PLAYING") {
      setGameStatus("PAUSED");
    } else if (gameStatus === "PAUSED") {
      setGameStatus("PLAYING");
    }
  };

  const handleActivePowerUp = (type: PowerUpType) => {
    setActivePowerUp(type);
    setTimeout(() => {
      setActivePowerUp(undefined);
    }, 4000);
  };

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar style="light" hidden={gameStatus === "PLAYING"} />

      {gameStatus === "MENU" ? (
        <MenuOverlay
          onStartGame={handleStartGame}
          highScore={highScore}
          unlockedLevel={unlockedLevel}
        />
      ) : (
        <>
          <GameCanvas
            key={`game_canvas_${currentLevelId}_${gameSessionId}`}
            level={levelConfig}
            gameStatus={gameStatus}
            score={score}
            lives={lives}
            wallpaper={getWallpaperByIndex(wallpaperIndex)}
            onScoreChange={handleScoreChange}
            onLifeChange={handleLifeChange}
            onGameOver={handleGameOver}
            onVictory={handleVictory}
            onActivePowerUp={handleActivePowerUp}
            onRewardCoins={handleRewardCoins}
          />

          <HUDOverlay
            level={levelConfig}
            score={score}
            highScore={highScore}
            coins={coins}
            lives={lives}
            combo={combo}
            gameStatus={gameStatus}
            activePowerUp={activePowerUp}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onPauseToggle={handlePauseToggle}
            onClose={() => {
              const nextUnlocked = Math.min(
                50,
                Math.max(unlockedLevel, currentLevelId)
              );
              if (nextUnlocked > unlockedLevel) {
                setUnlockedLevel(nextUnlocked);
                storageManager.saveUnlockedLevel(nextUnlocked);
              }
              adManager.showInterstitialIfEligible();
              setGameStatus("MENU");
            }}
          />

          {showRewardedModal && (
            <RewardedContinueModal
              score={score}
              levelId={currentLevelId}
              continuesUsed={continuesUsed}
              onContinueGame={handleAdRewardedSuccess}
              onDecline={handleAdRewardedDecline}
            />
          )}

          {gameStatus === "GAMEOVER" && (
            <GameOverModal
              score={score}
              highScore={highScore}
              levelId={currentLevelId}
              onRestart={() => handleStartGame(currentLevelId)}
              onMenu={() => {
                adManager.showInterstitialIfEligible();
                setGameStatus("MENU");
              }}
            />
          )}

          {gameStatus === "VICTORY" && (
            <VictoryModal
              score={score}
              levelId={currentLevelId}
              unlockedLevel={unlockedLevel}
              isReplay={isReplaying}
              onNextLevel={handleNextLevel}
              onResumeFrontier={() => handleStartGame(unlockedLevel)}
              onMenu={() => {
                const nextUnlocked = Math.min(
                  50,
                  Math.max(unlockedLevel, currentLevelId + 1)
                );
                setUnlockedLevel(nextUnlocked);
                storageManager.saveUnlockedLevel(nextUnlocked);
                adManager.showInterstitialIfEligible();
                setGameStatus("MENU");
              }}
            />
          )}
        </>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1020",
  },
});
