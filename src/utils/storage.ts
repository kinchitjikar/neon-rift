import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  UNLOCKED_LEVEL: '@orbit_breaker_unlocked_level',
  HIGH_SCORE: '@orbit_breaker_high_score',
  COINS: '@orbit_breaker_coins',
  SOUND_ENABLED: '@orbit_breaker_sound_enabled',
};

export interface GameProgress {
  unlockedLevel: number;
  highScore: number;
  coins: number;
  soundEnabled: boolean;
}

const DEFAULT_PROGRESS: GameProgress = {
  unlockedLevel: 1,
  highScore: 12500,
  coins: 1100,
  soundEnabled: true,
};

class StorageManager {
  private memoryCache: GameProgress = { ...DEFAULT_PROGRESS };

  private async safeGetItem(key: string): Promise<string | null> {
    try {
      if (typeof AsyncStorage !== 'undefined' && AsyncStorage?.getItem) {
        return await AsyncStorage.getItem(key);
      }
    } catch {
      // Ignored for fallback
    }
    return null;
  }

  private async safeSetItem(key: string, value: string): Promise<void> {
    try {
      if (typeof AsyncStorage !== 'undefined' && AsyncStorage?.setItem) {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      // Ignored for fallback
    }
  }

  public async loadProgress(): Promise<GameProgress> {
    try {
      const [unlockedStr, highScoreStr, coinsStr, soundStr] = await Promise.all([
        this.safeGetItem(STORAGE_KEYS.UNLOCKED_LEVEL),
        this.safeGetItem(STORAGE_KEYS.HIGH_SCORE),
        this.safeGetItem(STORAGE_KEYS.COINS),
        this.safeGetItem(STORAGE_KEYS.SOUND_ENABLED),
      ]);

      if (unlockedStr !== null) {
        const parsed = parseInt(unlockedStr, 10);
        if (!isNaN(parsed) && parsed >= 1) {
          this.memoryCache.unlockedLevel = Math.min(50, parsed);
        }
      }

      if (highScoreStr !== null) {
        const parsed = parseInt(highScoreStr, 10);
        if (!isNaN(parsed)) {
          this.memoryCache.highScore = parsed;
        }
      }

      if (coinsStr !== null) {
        const parsed = parseInt(coinsStr, 10);
        if (!isNaN(parsed)) {
          this.memoryCache.coins = parsed;
        }
      }

      if (soundStr !== null) {
        this.memoryCache.soundEnabled = soundStr === 'true';
      }

      return { ...this.memoryCache };
    } catch {
      return { ...this.memoryCache };
    }
  }

  public async saveUnlockedLevel(level: number): Promise<void> {
    const validLevel = Math.min(50, Math.max(1, level));
    if (validLevel > this.memoryCache.unlockedLevel) {
      this.memoryCache.unlockedLevel = validLevel;
    }
    await this.safeSetItem(
      STORAGE_KEYS.UNLOCKED_LEVEL,
      this.memoryCache.unlockedLevel.toString()
    );
  }

  public async saveHighScore(highScore: number): Promise<void> {
    if (highScore > this.memoryCache.highScore) {
      this.memoryCache.highScore = highScore;
      await this.safeSetItem(STORAGE_KEYS.HIGH_SCORE, highScore.toString());
    }
  }

  public async saveCoins(coins: number): Promise<void> {
    this.memoryCache.coins = coins;
    await this.safeSetItem(STORAGE_KEYS.COINS, coins.toString());
  }

  public async saveSoundEnabled(enabled: boolean): Promise<void> {
    this.memoryCache.soundEnabled = enabled;
    await this.safeSetItem(STORAGE_KEYS.SOUND_ENABLED, enabled ? 'true' : 'false');
  }

  public getCachedProgress(): GameProgress {
    return { ...this.memoryCache };
  }
}

export const storageManager = new StorageManager();
