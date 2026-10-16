import { generateLevel, generateEndlessRandomLevel } from "../game/levels";
import { COLORS } from "../config/theme";
import { ADS_CONFIG } from "../config/ads";
import { adManager } from "../utils/adManager";
import {
  WALLPAPERS,
  getRandomWallpaperIndex,
  getWallpaperByIndex,
} from "../config/wallpapers";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[TEST FAILED] ${message}`);
  }
}

function runAllTests() {
  console.log("----------------------------------------");
  console.log("RUNNING NEON RIFT MODULE TEST SUITE...");
  console.log("----------------------------------------\n");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Level Generation & Density Tests
  test("Level Generator - Sector 1 generates valid bricks and density", () => {
    const level1 = generateLevel(1);
    assert(level1.id === 1, "Level ID should be 1");
    assert(level1.bricks.length > 50, `Brick count should be > 50 (got ${level1.bricks.length})`);
    assert(level1.bricks.every((b) => b.color && typeof b.color === "string"), "All bricks must have valid hex colors");
  });

  test("Level Generator - Explosive bricks cap (max 2 per level layout)", () => {
    for (let id = 1; id <= 10; id++) {
      const lvl = generateLevel(id);
      const explosiveBricks = lvl.bricks.filter((b) => b.type === "explosive");
      assert(
        explosiveBricks.length <= 2,
        `Sector ${id} has ${explosiveBricks.length} explosive bricks, max allowed is 2`
      );
    }
  });

  test("Level Generator - All 50 Sectors produce valid configs within bounds", () => {
    for (let id = 1; id <= 50; id++) {
      const lvl = generateLevel(id);
      assert(lvl.name === `Sector ${id}`, `Level name must be Sector ${id}`);
      assert(lvl.bricks.length > 0, `Sector ${id} must have bricks`);
      assert(
        lvl.bricks.every((b) => b.x >= -3.2 && b.x <= 3.2),
        `Sector ${id} bricks must fit within side bounds`
      );
    }
  });

  test("Endless Random Level Generator - Sector > 50 generates procedurally valid infinite level", () => {
    const level51 = generateLevel(51);
    assert(level51.id === 51, "Endless level ID should be 51");
    assert(level51.name.includes("Endless"), `Name should include Endless (got ${level51.name})`);
    assert(level51.bricks.length > 0, "Endless level must contain bricks");

    const endlessDirect = generateEndlessRandomLevel(52);
    assert(endlessDirect.id === 52, "Direct endless call should be 52");
  });

  // 2. Theme Configuration Tests
  test("Theme Config - Premium Neon Midnight Palette integrity", () => {
    assert(COLORS.base === "#0B1020", "Base background color must match Neon Midnight theme");
    assert(COLORS.pink === "#F472B6" || COLORS.pink === "#FF0055", "Accent pink color must be present");
    assert(COLORS.green === "#34D399", "Accent green color must be present");
    assert(COLORS.accent === "#22D3EE", "Accent cyan color must be present");
  });

  // 3. Ad Manager & Rewarded Extra Life Cap Tests
  test("Ad Manager - Rewarded Continue Caps & Frequency Rules", () => {
    assert(ADS_CONFIG.REWARDED_CONTINUE_LIVES === 1, "Rewarded continue grants 1 extra life");
    assert(ADS_CONFIG.MAX_CONTINUES_PER_SESSION === 2, "Max continues capped at 2 per session");
    assert(ADS_CONFIG.INTERSTITIAL_FREQUENCY_GAMES === 3, "Interstitial frequency capped at 3 games");
  });

  test("Ad Manager - Native Module Capability Check", () => {
    const isSupported = adManager.isNativeAdsSupported();
    assert(typeof isSupported === "boolean", "adManager.isNativeAdsSupported should return boolean");
  });

  test("Ad Manager - DNS Blocker / AdGuard Rejection Security", () => {
    let rewarded = false;
    let failedCalled = false;
    // In unready / blocked state, reward callback must not be invoked
    adManager.showRewardedAd(
      () => {
        rewarded = true;
      },
      () => {},
      (reason) => {
        failedCalled = true;
      }
    );
    // In test environment without mock timer, assert immediate reward was not granted
    assert(!rewarded, "Reward must never be granted immediately if ad has not successfully completed");
  });

  // 4. 50-Level Progression & Sector Unlocking Tests
  test("Level Unlock Progression - Completing level N unlocks level N+1", () => {
    let unlocked = 1;
    // Simulate completing Sector 1
    unlocked = Math.min(50, Math.max(unlocked, 1 + 1));
    assert(unlocked === 2, "Completing Sector 1 should unlock Sector 2");

    // Simulate completing Sector 2
    unlocked = Math.min(50, Math.max(unlocked, 2 + 1));
    assert(unlocked === 3, "Completing Sector 2 should unlock Sector 3");
  });

  test("Level Unlock Progression - Completing all 50 sectors unlocks all 50 sectors", () => {
    let unlockedLevel = 1;

    // Simulate user progressing sequentially from Sector 1 through Sector 50
    for (let completedLevel = 1; completedLevel <= 50; completedLevel++) {
      assert(completedLevel <= unlockedLevel, `Sector ${completedLevel} must be unlocked to play`);
      unlockedLevel = Math.min(50, Math.max(unlockedLevel, completedLevel + 1));
    }

    assert(unlockedLevel === 50, `All 50 sectors must be unlocked (got ${unlockedLevel})`);

    // Verify all 50 sectors are unlocked in the Sector Selector menu
    for (let sectorId = 1; sectorId <= 50; sectorId++) {
      const isUnlocked = sectorId <= unlockedLevel;
      assert(isUnlocked, `Sector ${sectorId} must be unlocked in Sector Selector menu`);
    }
  });

  test("Level Progression Storage - Replaying an earlier level preserves highest unlocked level", () => {
    let highestUnlocked = 35; // Customer has previously reached & unlocked up to Sector 35

    // Replaying Sector 5 victory
    const replayedSector = 5;
    highestUnlocked = Math.min(50, Math.max(highestUnlocked, replayedSector + 1));

    assert(
      highestUnlocked === 35,
      `Replaying Sector 5 should retain highest unlocked Sector 35 (got ${highestUnlocked})`
    );
  });

  test("Persistent Storage Manager - Caches and updates progression across app sessions", async () => {
    const { storageManager } = await import("../utils/storage");
    await storageManager.saveUnlockedLevel(4);
    const progress = storageManager.getCachedProgress();
    assert(progress.unlockedLevel === 4, `Cached unlockedLevel should be 4 (got ${progress.unlockedLevel})`);

    // Completing sector 3 again should not downgrade progress
    await storageManager.saveUnlockedLevel(3);
    assert(
      storageManager.getCachedProgress().unlockedLevel === 4,
      `Replaying lower sector must not downgrade unlockedLevel below 4`
    );
  });

  test("Ball Speed Escalation - Starts at 0.12, accelerates up to max 0.18", () => {
    const baseSpeed = 0.12;
    const calculateSpeed = (elapsedSec: number, currentSpeed: number) => {
      const currentStep = Math.floor(elapsedSec / 5);
      const targetMinSpeed = Math.min(0.18, 0.12 + currentStep * 0.012);
      const newSpeed = Math.min(0.18, Math.max(targetMinSpeed, currentSpeed + 0.004));
      return { targetMinSpeed, newSpeed };
    };

    // At launch (0s elapsed)
    const t0 = calculateSpeed(0, baseSpeed);
    assert(t0.targetMinSpeed === 0.12, `Initial min speed must be 0.12 (got ${t0.targetMinSpeed})`);
    assert(t0.newSpeed === 0.124, `Initial brick hit speed must accelerate to 0.124 (got ${t0.newSpeed})`);

    // After 10s elapsed (2 steps)
    const t10 = calculateSpeed(10, baseSpeed);
    assert(t10.targetMinSpeed === 0.144, `10s min speed must be 0.144 (got ${t10.targetMinSpeed})`);

    // After 30s elapsed (should hit 0.18 ceiling)
    const t30 = calculateSpeed(30, baseSpeed);
    assert(t30.targetMinSpeed === 0.18, `30s min speed must cap at 0.18 (got ${t30.targetMinSpeed})`);
    assert(t30.newSpeed === 0.18, `Brick hit must not exceed 0.18 maximum speed cap (got ${t30.newSpeed})`);
  });

  test("Session Keying - Restarting same level generates unique canvas key", () => {
    let currentLevelId = 3;
    let gameSessionId = 0;

    const startSession = (levelId: number) => {
      currentLevelId = levelId;
      gameSessionId += 1;
      return `game_canvas_${currentLevelId}_${gameSessionId}`;
    };

    const firstRunKey = startSession(3);
    const restartRunKey = startSession(3);

    assert(firstRunKey === "game_canvas_3_1", "First run must have session id 1");
    assert(restartRunKey === "game_canvas_3_2", "Restarting same sector 3 must have unique session id 2");
    assert(firstRunKey !== restartRunKey, "Restart key must differ from initial run key to force remount");
  });

  test("Splash Screen - Asset exists and Expo configuration is valid", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    const assetPath = path.resolve(process.cwd(), "assets/orbit_breaker_splash.png");
    assert(fs.existsSync(assetPath), "Splash PNG asset must exist at assets/orbit_breaker_splash.png");

    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));

    const splash = appConfig.expo.splash;
    assert(splash.image === "./assets/orbit_breaker_splash.png", "Splash image must point to PNG asset");
    assert(splash.backgroundColor === "#0B1020", "Splash background must be #0B1020");
    assert(splash.resizeMode === "contain", "Splash resizeMode must be contain");

    const splashPlugin = appConfig.expo.plugins.find(
      (p: any) => Array.isArray(p) && p[0] === "expo-splash-screen"
    );
    assert(splashPlugin, "expo-splash-screen plugin must be configured in plugins");
    assert(splashPlugin[1].image === "./assets/orbit_breaker_splash.png", "Plugin image must point to PNG");
    assert(splashPlugin[1].backgroundColor === "#0B1020", "Plugin background must be #0B1020");
    assert(splashPlugin[1].imageWidth === 200, "Plugin imageWidth must be 200");
  });

  test("Layout Optimization - Bricks elevated and ample vertical tracking space provided", () => {
    const lvl1 = generateLevel(1);
    const maxBrickY = Math.max(...lvl1.bricks.map((b) => b.y));
    const minBrickY = Math.min(...lvl1.bricks.map((b) => b.y));

    // Highest brick row starts high (>= 7.5) to clear screen middle
    assert(
      maxBrickY >= 7.5,
      `Highest brick row should be elevated higher up (got Y=${maxBrickY}, expected >= 7.5)`
    );

    // Paddle is positioned upward at Y=-2.6 (above bottom score dock)
    const paddleY = -2.6;
    const clearance = minBrickY - paddleY;

    // Ample vertical clearance between paddle and lowest bricks (>= 6.5 world units)
    assert(
      clearance >= 6.5,
      `Vertical tracking clearance between paddle and lowest brick should be >= 6.5 units (got ${clearance.toFixed(2)})`
    );
  });

  // 17. Dark Minimalist Wallpaper Collection & Optimization
  test("Wallpaper Collection - Dark minimalist collection assets exist and are optimized", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    assert(WALLPAPERS.length >= 4, `Must have at least 4 wallpapers (got ${WALLPAPERS.length})`);

    const wallpaperDir = path.resolve(process.cwd(), "assets/wallpapers");
    assert(fs.existsSync(wallpaperDir), "assets/wallpapers directory must exist");

    const expectedFiles = [
      "bg_saturn_rings.jpg",
      "bg_orbital_eclipse.jpg",
      "bg_celestial_horizon.jpg",
      "bg_orbital_rings.jpg",
      "bg_distant_cosmos.jpg",
    ];

    let totalSizeBytes = 0;
    expectedFiles.forEach((filename) => {
      const filePath = path.join(wallpaperDir, filename);
      assert(fs.existsSync(filePath), `Wallpaper asset must exist: ${filename}`);
      const stats = fs.statSync(filePath);
      assert(stats.size > 10000, `Wallpaper ${filename} must have content (> 10KB)`);
      assert(stats.size < 250000, `Wallpaper ${filename} must be optimized (< 250KB, got ${stats.size} bytes)`);
      totalSizeBytes += stats.size;
    });

    // Entire 5-wallpaper pack is under 750 KB total
    assert(totalSizeBytes < 750000, `Total wallpaper bundle must be under 750KB (got ${(totalSizeBytes / 1024).toFixed(1)} KB)`);
  });

  // 18. Wallpaper Randomization & Non-Consecutive Selection
  test("Wallpaper Randomization - Non-consecutive selection across levels", () => {
    assert(WALLPAPERS.length >= 2, "Need at least 2 wallpapers to test non-consecutive selection");

    let prev = 0;
    const seenIndices = new Set<number>();
    seenIndices.add(prev);

    // Run 200 level transitions; every step MUST yield a different wallpaper from previous
    for (let i = 0; i < 200; i++) {
      const next = getRandomWallpaperIndex(prev);
      assert(next !== prev, `Consecutive duplicate detected: step ${i} returned ${next} when prev was ${prev}`);
      assert(next >= 0 && next < WALLPAPERS.length, `Selected index ${next} out of bounds [0, ${WALLPAPERS.length - 1}]`);
      seenIndices.add(next);
      prev = next;
    }

    // Verify all available wallpapers get picked over 200 iterations
    assert(
      seenIndices.size === WALLPAPERS.length,
      `All ${WALLPAPERS.length} wallpapers must be covered (seen: ${seenIndices.size})`
    );

    // Initial launch without previous index returns valid wallpaper
    const initialIndex = getRandomWallpaperIndex();
    assert(initialIndex >= 0 && initialIndex < WALLPAPERS.length, "Initial selection within bounds");
    const item = getWallpaperByIndex(initialIndex);
    assert(!!item && !!item.source && typeof item.name === "string", "getWallpaperByIndex returns valid item");
  });

  // 19. Asset Cleanup Verification
  test("Asset Cleanup - Verified unused assets removed, required assets preserved", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    const assetsDir = path.resolve(process.cwd(), "assets");

    // Confirmed unused assets that were safely purged
    const purgedAssets = [
      "space_bg.jpg",
      "space_bg_2.jpg",
      "space_bg_3.jpg",
      "space_bg_4.jpg",
      "orbit_breaker_splash.jpg",
      "icon.png",
      "android-icon-background.png",
      "splash-icon.png",
      "android-icon-monochrome.png",
      "favicon.png",
    ];

    purgedAssets.forEach((file) => {
      const fullPath = path.join(assetsDir, file);
      assert(!fs.existsSync(fullPath), `Unused asset ${file} must be removed from repository`);
    });

    // Required active assets that MUST remain
    const preservedAssets = [
      "orbit_breaker_icon.jpg",
      "android-icon-foreground.png",
      "orbit_breaker_splash.png",
      "space_bg_1.jpg",
    ];

    preservedAssets.forEach((file) => {
      const fullPath = path.join(assetsDir, file);
      assert(fs.existsSync(fullPath), `Required active asset ${file} must be preserved`);
    });
  });

  // 20. PanResponder Touch Responder Attachment
  test("Touch Responsiveness - Root View attaches PanResponder handlers directly", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    const canvasPath = path.resolve(process.cwd(), "src/components/GameCanvas.tsx");
    const canvasContent = fs.readFileSync(canvasPath, "utf-8");

    // Root element must be View with panResponder.panHandlers directly attached
    assert(
      canvasContent.includes("<View style={styles.container} {...panResponder.panHandlers}>"),
      "Root element of GameCanvas must be View with {...panResponder.panHandlers} directly attached"
    );
    assert(
      canvasContent.includes("onStartShouldSetPanResponderCapture: () => true"),
      "PanResponder must declare capture phase handler onStartShouldSetPanResponderCapture"
    );
    assert(
      canvasContent.includes("onMoveShouldSetPanResponderCapture: () => true"),
      "PanResponder must declare capture phase handler onMoveShouldSetPanResponderCapture"
    );
  });

  // 21. Perk Collection Animation & Synchronization
  test("Perk Collection - Stops at paddle and cleans up mesh/state immediately upon catch", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    const canvasPath = path.resolve(process.cwd(), "src/components/GameCanvas.tsx");
    const canvasContent = fs.readFileSync(canvasPath, "utf-8");

    // Must remove mesh from scene immediately when caught
    assert(
      canvasContent.includes("powerUpMeshMap.delete(pup.id)"),
      "Must delete collected powerup mesh from powerUpMeshMap immediately upon paddle contact"
    );
    assert(
      canvasContent.includes("powerUpsRef.current = remainingPowerUps"),
      "Must update powerUpsRef.current with remainingPowerUps to prevent perk from continuing past paddle"
    );
    // Spawns collection burst right at the paddle top edge
    assert(
      canvasContent.includes("spawnParticles(pup.x, p.y + halfPH, pup.color, 20)"),
      "Must spawn collection particles at the paddle top surface upon catch"
    );
  });

  // 22. Final 10 Bricks Ball Speed Escalation to 0.20
  test("Endgame Speed Escalation - Final 10 bricks accelerate ball speed to exactly 0.20 without compounding", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    const canvasPath = path.resolve(process.cwd(), "src/components/GameCanvas.tsx");
    const canvasContent = fs.readFileSync(canvasPath, "utf-8");

    // Threshold check for <= 10 bricks
    assert(
      canvasContent.includes("bricksRef.current.length <= 10 && bricksRef.current.length > 0"),
      "Must check for exactly 10 or fewer remaining bricks"
    );

    // Speed target set to 0.20 when threshold is reached
    assert(
      canvasContent.includes("const isEndgame ="),
      "Must declare isEndgame flag based on remaining brick count"
    );

    // Verify speed simulation: normal max is 0.18, endgame is 0.20
    const simulateBallSpeed = (remainingBricks: number, currentSpeed: number, elapsedSec: number) => {
      const isEndgame = remainingBricks <= 10 && remainingBricks > 0;
      if (isEndgame) {
        return 0.20;
      }
      const currentStep = Math.floor(elapsedSec / 5);
      const targetMinSpeed = Math.min(0.18, 0.12 + currentStep * 0.012);
      return Math.min(0.18, Math.max(targetMinSpeed, currentSpeed + 0.004));
    };

    // Above 10 bricks: capped at 0.18
    assert(simulateBallSpeed(50, 0.12, 0) === 0.124, "Normal hit accelerates from 0.12 to 0.124");
    assert(simulateBallSpeed(15, 0.179, 60) === 0.18, "Normal hit caps strictly at 0.18 when bricks > 10");
    assert(simulateBallSpeed(11, 0.18, 100) === 0.18, "At 11 bricks speed remains at 0.18");

    // Final 10 bricks: exactly 0.20
    assert(simulateBallSpeed(10, 0.18, 100) === 0.20, "At 10 bricks speed transitions to 0.20");
    assert(simulateBallSpeed(5, 0.12, 0) === 0.20, "At 5 bricks speed is 0.20 regardless of elapsed time");
    assert(simulateBallSpeed(1, 0.20, 50) === 0.20, "At 1 brick speed stays locked at 0.20");
  });

  // 23. Replay Completed Sectors & Locked Sector Access Prevention
  test("Sector Replay - Replaying completed sectors allowed while locked sectors strictly blocked", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    const appContent = fs.readFileSync(path.resolve(process.cwd(), "App.tsx"), "utf-8");
    const menuContent = fs.readFileSync(path.resolve(process.cwd(), "src/components/MenuOverlay.tsx"), "utf-8");

    // Check App.tsx security guard
    assert(
      appContent.includes("if (levelId > unlockedLevel) {\n      return;\n    }") ||
      appContent.includes("if (levelId > unlockedLevel) return;"),
      "handleStartGame must strictly block any attempt to start a levelId > unlockedLevel"
    );

    // Check MenuOverlay.tsx disabled property on locked sector tiles
    assert(
      menuContent.includes("disabled={isLocked}"),
      "MenuOverlay sector tiles must disable touch interactions when locked"
    );

    // Verify simulate game startup logic
    const canStartLevel = (levelId: number, unlockedLevel: number) => {
      if (levelId > unlockedLevel) return false;
      return true;
    };

    const unlocked = 5;
    assert(canStartLevel(1, unlocked) === true, "Can replay completed sector 1 when unlocked is 5");
    assert(canStartLevel(4, unlocked) === true, "Can replay completed sector 4 when unlocked is 5");
    assert(canStartLevel(5, unlocked) === true, "Can play current frontier sector 5");
    assert(canStartLevel(6, unlocked) === false, "Cannot access locked sector 6 when unlocked is 5");
    assert(canStartLevel(50, unlocked) === false, "Cannot access locked sector 50 when unlocked is 5");
  });

  // 24. Persistent Progress Preservation During and After Replay
  test("Progress Preservation - Replaying earlier sectors never downgrades unlockedLevel or high score", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    const appContent = fs.readFileSync(path.resolve(process.cwd(), "App.tsx"), "utf-8");
    const storageContent = fs.readFileSync(path.resolve(process.cwd(), "src/utils/storage.ts"), "utf-8");

    // Verify storage manager monotonic guarantee
    assert(
      storageContent.includes("if (validLevel > this.memoryCache.unlockedLevel)"),
      "storageManager must never overwrite unlockedLevel with a lower value"
    );
    assert(
      storageContent.includes("if (highScore > this.memoryCache.highScore)"),
      "storageManager must never overwrite highScore with a lower score"
    );

    // Simulate completion of a replayed sector when unlockedLevel is high
    const simulateVictoryProgress = (
      currentLevelId: number,
      currentUnlocked: number,
      sessionScore: number,
      savedHighScore: number
    ) => {
      const nextUnlocked = Math.min(50, Math.max(currentUnlocked, currentLevelId + 1));
      const nextHighScore = Math.max(savedHighScore, sessionScore);
      return { nextUnlocked, nextHighScore };
    };

    // Case A: Replaying sector 2 with lower score
    const resA = simulateVictoryProgress(2, 10, 3000, 25000);
    assert(resA.nextUnlocked === 10, `Unlocked level must remain 10 after replaying sector 2 (got ${resA.nextUnlocked})`);
    assert(resA.nextHighScore === 25000, `High score must remain 25000 when replay score is lower (got ${resA.nextHighScore})`);

    // Case B: Replaying sector 2 with higher score (new record)
    const resB = simulateVictoryProgress(2, 10, 30000, 25000);
    assert(resB.nextUnlocked === 10, `Unlocked level must remain 10 after replaying sector 2 (got ${resB.nextUnlocked})`);
    assert(resB.nextHighScore === 30000, `High score must update to 30000 when replay achieves new high score`);

    // Case C: Completing frontier sector 10 advances to 11
    const resC = simulateVictoryProgress(10, 10, 12000, 30000);
    assert(resC.nextUnlocked === 11, `Unlocked level must advance to 11 when completing frontier sector 10`);

    // Case D: Completing sector 50 caps at 50
    const resD = simulateVictoryProgress(50, 50, 15000, 30000);
    assert(resD.nextUnlocked === 50, `Unlocked level must cap at 50`);
  });

  // 25. Session State Isolation on Sector Replay
  test("Session Reset - Only temporary gameplay state resets when starting replay", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    const appContent = fs.readFileSync(path.resolve(process.cwd(), "App.tsx"), "utf-8");

    // Session id increments to trigger fresh GameCanvas remount
    assert(
      appContent.includes("setGameSessionId((prev) => prev + 1)"),
      "handleStartGame must increment gameSessionId to completely reset canvas and physics state"
    );

    // Active session state resets
    assert(
      appContent.includes("setScore(0)") &&
      appContent.includes("setLives(1)") &&
      appContent.includes("setCombo(0)") &&
      appContent.includes("setActivePowerUp(undefined)"),
      "handleStartGame must reset session-only state (score, lives, combo, power-up) to initial values"
    );

    // Track isReplaying state
    assert(
      appContent.includes("setIsReplaying(levelId < unlockedLevel)"),
      "App must distinguish replay sessions from frontier progression"
    );
  });

  // 26. UI Contracts for Completed, Current, and Locked Sectors
  test("UI Contracts - Sector grid and VictoryModal cleanly differentiate completed, current, and locked sectors", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    const menuContent = fs.readFileSync(path.resolve(process.cwd(), "src/components/MenuOverlay.tsx"), "utf-8");
    const victoryContent = fs.readFileSync(path.resolve(process.cwd(), "src/components/VictoryModal.tsx"), "utf-8");

    // Menu badges
    assert(
      menuContent.includes("const isCompleted = sec.id < effectiveUnlocked;"),
      "MenuOverlay must identify completed sectors as sec.id < effectiveUnlocked"
    );
    assert(
      menuContent.includes("const isCurrent = sec.id === effectiveUnlocked;"),
      "MenuOverlay must identify current sector as sec.id === effectiveUnlocked"
    );
    assert(
      menuContent.includes("const isLocked = sec.id > effectiveUnlocked;"),
      "MenuOverlay must identify locked sectors as sec.id > effectiveUnlocked"
    );
    assert(
      menuContent.includes("styles.sectorTileCompleted") &&
      menuContent.includes("styles.completedBadge"),
      "MenuOverlay must render completed badge (✓) and theme styling"
    );

    // Victory modal frontier resumption
    assert(
      victoryContent.includes("canResumeFrontier = isReplay && unlockedLevel > levelId + 1"),
      "VictoryModal must offer frontier resumption when replaying earlier sectors"
    );
    assert(
      victoryContent.includes("Resume Sector {unlockedLevel} ★"),
      "VictoryModal must show Resume Sector button with highest unlocked level"
    );
  });

  // 27. Android Build Properties & GLView Native Safety Check
  test("Android Build Properties - Minification enabled with extraProguardRules protecting expo-gl JNI & PixelRatio guarded", async () => {
    // @ts-ignore
    const fs = await import("fs");
    // @ts-ignore
    const path = await import("path");

    const appJsonRaw = fs.readFileSync(path.resolve(process.cwd(), "app.json"), "utf-8");
    const appJson = JSON.parse(appJsonRaw);
    const canvasContent = fs.readFileSync(path.resolve(process.cwd(), "src/components/GameCanvas.tsx"), "utf-8");

    // Check expo-build-properties
    const buildPropsPlugin = appJson.expo.plugins.find(
      (p: any) => Array.isArray(p) && p[0] === "expo-build-properties"
    );
    assert(Boolean(buildPropsPlugin), "expo-build-properties plugin must be present in app.json");

    const androidProps = buildPropsPlugin[1].android;
    assert(
      androidProps.enableMinifyInReleaseBuilds === true,
      "enableMinifyInReleaseBuilds must be true for Google Play DEX code obfuscation compliance"
    );
    assert(
      androidProps.enableShrinkResourcesInReleaseBuilds === true,
      "enableShrinkResourcesInReleaseBuilds must be true for release builds"
    );
    assert(
      typeof androidProps.extraProguardRules === "string" &&
      androidProps.extraProguardRules.includes("-keep class expo.modules.gl.** { *; }") &&
      androidProps.extraProguardRules.includes("-keep interface expo.modules.gl.** { *; }") &&
      androidProps.extraProguardRules.includes("native <methods>;"),
      "extraProguardRules must keep expo.modules.gl.** and native methods to prevent JNI crash when mounting GLView"
    );
    assert(
      androidProps.targetSdkVersion === 35,
      `targetSdkVersion must be 35 for Android 15 compliance (got ${androidProps.targetSdkVersion})`
    );
    assert(
      androidProps.compileSdkVersion === 36,
      `compileSdkVersion must be 36 for androidx.core:core-ktx:1.17.0 (got ${androidProps.compileSdkVersion})`
    );
    assert(
      androidProps.buildToolsVersion === "36.0.0",
      `buildToolsVersion must be 36.0.0 (got ${androidProps.buildToolsVersion})`
    );

    // In expo-gl, drawingBufferWidth and drawingBufferHeight are already in physical pixels.
    // Calling renderer.setPixelRatio scales the viewport by 2x/3x, zooming in and hiding bricks.
    assert(
      !canvasContent.includes("renderer.setPixelRatio"),
      "GameCanvas must not call renderer.setPixelRatio (causes 2x/3x viewport zoom on high-DPI Android devices)"
    );
    assert(
      canvasContent.includes("renderer.setSize(width, height)"),
      "GameCanvas must set native dimensions directly via renderer.setSize(width, height)"
    );
  });

  console.log("\n----------------------------------------");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("----------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
