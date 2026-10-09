import { ADS_CONFIG } from '../config/ads';

let mobileAds: any = null;
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;
let hasNativeModule = false;
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

try {
  const GoogleMobileAds = require('react-native-google-mobile-ads');
  mobileAds = GoogleMobileAds.default;
  RewardedAd = GoogleMobileAds.RewardedAd;
  RewardedAdEventType = GoogleMobileAds.RewardedAdEventType;
  InterstitialAd = GoogleMobileAds.InterstitialAd;
  AdEventType = GoogleMobileAds.AdEventType;
  TestIds = GoogleMobileAds.TestIds;
  hasNativeModule = true;
} catch (e) {
  hasNativeModule = false;
  console.log('AdMob native module not available in current environment (Expo Go fallback enabled)');
}

class AdManager {
  private isInitialized = false;
  private gameOverCount = 0;
  private lastInterstitialTime = 0;
  private rewardedAd: any = null;
  private interstitialAd: any = null;

  public async init() {
    if (this.isInitialized || !hasNativeModule) return;
    try {
      if (mobileAds) {
        await mobileAds().initialize();
        this.isInitialized = true;
        this.preloadRewarded();
        this.preloadInterstitial();
      }
    } catch (e) {
      console.log('AdMob initialize fallback:', e);
    }
  }

  private preloadRewarded() {
    if (!hasNativeModule || !RewardedAd) return;
    try {
      const adUnitId = isDev && TestIds ? TestIds.REWARDED : ADS_CONFIG.REWARDED_ID;
      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });
      this.rewardedAd.load();
    } catch (e) {
      // Fallback
    }
  }

  private preloadInterstitial() {
    if (!hasNativeModule || !InterstitialAd) return;
    try {
      const adUnitId = isDev && TestIds ? TestIds.INTERSTITIAL : ADS_CONFIG.INTERSTITIAL_ID;
      this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });
      this.interstitialAd.load();
    } catch (e) {
      // Fallback
    }
  }

  public isRewardedAdReady(): boolean {
    return !!(hasNativeModule && this.rewardedAd && this.rewardedAd.loaded);
  }

  public showRewardedAd(
    onRewardEarned: () => void,
    onAdClosed: () => void,
    onAdFailed?: (reason: string) => void
  ) {
    if (hasNativeModule) {
      if (!this.rewardedAd || !this.rewardedAd.loaded) {
        // Ad not loaded (e.g., blocked by AdGuard DNS, private DNS, or no internet)
        this.preloadRewarded();
        if (onAdFailed) {
          onAdFailed('Ad not ready or blocked by Private DNS/AdGuard. Disable ad-blocking to get extra lives.');
        } else {
          onAdClosed();
        }
        return;
      }

      let earned = false;
      let hasFinished = false;

      let unsubscribeReward = () => {};
      let unsubscribeClosed = () => {};
      let unsubscribeError = () => {};

      const cleanup = () => {
        if (hasFinished) return;
        hasFinished = true;
        unsubscribeReward();
        unsubscribeClosed();
        unsubscribeError();
      };

      if (RewardedAdEventType && RewardedAdEventType.EARNED_REWARD) {
        unsubscribeReward = this.rewardedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            earned = true;
          }
        );
      }

      if (AdEventType && AdEventType.CLOSED) {
        unsubscribeClosed = this.rewardedAd.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            cleanup();
            this.preloadRewarded();
            if (earned) {
              onRewardEarned();
            } else {
              onAdClosed();
            }
          }
        );
      }

      if (AdEventType && AdEventType.ERROR) {
        unsubscribeError = this.rewardedAd.addAdEventListener(
          AdEventType.ERROR,
          (err: any) => {
            cleanup();
            this.preloadRewarded();
            if (onAdFailed) {
              onAdFailed('Ad failed to load. Please check your internet or DNS ad blocker.');
            } else {
              onAdClosed();
            }
          }
        );
      }

      try {
        this.rewardedAd.show();
      } catch (e) {
        cleanup();
        this.preloadRewarded();
        if (onAdFailed) {
          onAdFailed('Could not display ad.');
        } else {
          onAdClosed();
        }
      }
    } else {
      // In environment without native AdMob module (Expo Go / mock dev)
      if (isDev) {
        setTimeout(() => {
          onRewardEarned();
        }, 1500);
      } else {
        if (onAdFailed) {
          onAdFailed('Ad system not available.');
        } else {
          onAdClosed();
        }
      }
    }
  }

  public shouldShowInterstitial(): boolean {
    this.gameOverCount += 1;
    const now = Date.now();
    const timeSinceLast = (now - this.lastInterstitialTime) / 1000;

    if (
      this.gameOverCount >= ADS_CONFIG.INTERSTITIAL_MIN_GAMES_BEFORE_FIRST &&
      (this.gameOverCount - ADS_CONFIG.INTERSTITIAL_MIN_GAMES_BEFORE_FIRST) % ADS_CONFIG.INTERSTITIAL_FREQUENCY_GAMES === 0 &&
      timeSinceLast >= ADS_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS
    ) {
      return true;
    }
    return false;
  }

  public showInterstitialIfEligible() {
    if (!this.shouldShowInterstitial()) return;

    if (hasNativeModule && this.interstitialAd && this.interstitialAd.loaded) {
      this.lastInterstitialTime = Date.now();
      const unsubscribeClosed = this.interstitialAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          unsubscribeClosed();
          this.preloadInterstitial();
        }
      );
      this.interstitialAd.show();
    } else if (hasNativeModule) {
      this.preloadInterstitial();
    }
  }

  public isNativeAdsSupported(): boolean {
    return hasNativeModule;
  }
}

export const adManager = new AdManager();
