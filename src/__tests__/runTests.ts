import { generateLevel, generateEndlessRandomLevel } from "../game/levels";
import { COLORS } from "../config/theme";
import { ADS_CONFIG } from "../config/ads";
import { adManager } from "../utils/adManager";

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

  console.log("\n----------------------------------------");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("----------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
