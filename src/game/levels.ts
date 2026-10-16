import { Brick, LevelConfig, PowerUpType } from "../types/game";

const POWERUP_TYPES: PowerUpType[] = [
  "wide_paddle",
  "multi_ball",
  "shield",
  // "slow_motion",
];

function getRandomPowerUp(dropChance = 0.08): PowerUpType | undefined {
  if (Math.random() < dropChance) {
    const idx = Math.floor(Math.random() * POWERUP_TYPES.length);
    return POWERUP_TYPES[idx];
  }
  return undefined;
}

const PLANETS = [
  "Saturn",
  "Pegasus Prime",
  "Milky Way Core",
  "Andromeda Sector",
  "Orion Nebula",
  "Cygnus Alpha",
  "Crab Nebula",
  "Vega System",
  "Altair Prime",
  "Centauri Void",
  "Sirius B",
  "Kepler 186f",
  "Cassiopeia",
  "Pleiades Cluster",
  "Proxima Centauri",
  "Betelgeuse",
  "Polaris Base",
  "Titan Outpost",
  "Ganymede Fortress",
  "Europa Rift",
  "Enceladus Vault",
  "Triton Outpost",
  "Neptune Abyss",
  "Uranus Cloud",
  "Jupiter Storm",
  "Mars Colony",
  "Phobos Station",
  "Deimos Gate",
  "Lunar Base",
  "Solar Core",
  "Helios Citadel",
  "Hyperion Ridge",
  "Eris Sector",
  "Sedna Horizon",
  "Makemake Arc",
  "Haumea Ring",
  "Ceres Station",
  "Vesta Belt",
  "Pallas Sector",
  "Juno Matrix",
  "Astraea Cluster",
  "Hebe Citadel",
  "Iris Rift",
  "Flora Cloud",
  "Metis Core",
  "Eunomia Grid",
  "Psyche Mine",
  "Themis Nebula",
  "Amphitrite Void",
  "Fortuna Prime",
];

const THEME_COLORS = [
  "#38BDF8",
  "#818CF8",
  "#A78BFA",
  "#94A3B8",
  "#2DD4BF",
  "#F472B6",
  "#60A5FA",
  "#C084FC",
  "#34D399",
  "#22D3EE",
];

type PatternTemplate = number[][];

// 10 Dense, High-Brick-Count Algorithmic Pattern Generators (11 Columns Wide)
// Legend: 0=Empty, 1=Normal, 2=Silver/High-Points, 3=Armored, 4=Explosive (Minimal)
const PATTERNS: PatternTemplate[] = [
  // Pattern 0: Mega Diamond Citadel (10 rows x 11 cols)
  [
    [0, 0, 0, 0, 1, 3, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 3, 2, 1, 0, 0, 0],
    [0, 0, 1, 2, 3, 4, 3, 2, 1, 0, 0],
    [0, 1, 2, 3, 1, 1, 1, 3, 2, 1, 0],
    [1, 2, 3, 1, 2, 3, 2, 1, 3, 2, 1],
    [1, 2, 3, 1, 2, 3, 2, 1, 3, 2, 1],
    [0, 1, 2, 3, 1, 1, 1, 3, 2, 1, 0],
    [0, 0, 1, 2, 3, 1, 3, 2, 1, 0, 0],
    [0, 0, 0, 1, 2, 3, 2, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  ],
  // Pattern 1: Phoenix Wings (11 rows x 11 cols)
  [
    [1, 1, 0, 0, 0, 3, 0, 0, 0, 1, 1],
    [1, 2, 1, 0, 1, 3, 1, 0, 1, 2, 1],
    [1, 2, 2, 1, 2, 3, 2, 1, 2, 2, 1],
    [1, 3, 2, 2, 3, 4, 3, 2, 2, 3, 1],
    [1, 1, 3, 3, 3, 2, 3, 3, 3, 1, 1],
    [0, 1, 1, 2, 2, 3, 2, 2, 1, 1, 0],
    [0, 0, 1, 1, 2, 3, 2, 1, 1, 0, 0],
    [0, 1, 2, 3, 1, 1, 1, 3, 2, 1, 0],
    [1, 2, 3, 1, 0, 0, 0, 1, 3, 2, 1],
    [1, 2, 1, 0, 0, 0, 0, 0, 1, 2, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  ],
  // Pattern 2: Orbital Station Barriers (10 rows x 11 cols)
  [
    [1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1],
    [2, 2, 2, 3, 2, 4, 2, 3, 2, 2, 2],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [2, 2, 2, 3, 2, 1, 2, 3, 2, 2, 2],
    [1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1],
  ],
  // Pattern 3: Alien Vanguard Fortress (10 rows x 11 cols)
  [
    [0, 0, 1, 1, 0, 3, 0, 1, 1, 0, 0],
    [0, 1, 2, 2, 1, 3, 1, 2, 2, 1, 0],
    [1, 2, 3, 3, 2, 1, 2, 3, 3, 2, 1],
    [1, 2, 3, 4, 3, 3, 3, 4, 3, 2, 1],
    [1, 1, 2, 3, 3, 2, 3, 3, 2, 1, 1],
    [0, 1, 1, 2, 2, 3, 2, 2, 1, 1, 0],
    [1, 2, 3, 1, 1, 1, 1, 1, 3, 2, 1],
    [1, 0, 1, 2, 3, 0, 3, 2, 1, 0, 1],
    [1, 0, 0, 1, 2, 3, 2, 1, 0, 0, 1],
    [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
  ],
  // Pattern 4: Quantum Spiral Core (10 rows x 11 cols)
  [
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
    [3, 1, 2, 2, 2, 2, 2, 2, 2, 1, 3],
    [3, 1, 2, 3, 3, 3, 3, 3, 2, 1, 3],
    [3, 1, 2, 3, 4, 1, 2, 3, 2, 1, 3],
    [3, 1, 2, 3, 2, 2, 2, 3, 2, 1, 3],
    [3, 1, 2, 3, 3, 3, 3, 3, 2, 1, 3],
    [3, 1, 2, 2, 2, 2, 2, 2, 2, 1, 3],
    [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  ],
  // Pattern 5: Titan Wedge Shield (10 rows x 11 cols)
  [
    [1, 1, 1, 1, 3, 4, 3, 1, 1, 1, 1],
    [1, 2, 2, 2, 3, 1, 3, 2, 2, 2, 1],
    [0, 1, 2, 2, 3, 1, 3, 2, 2, 1, 0],
    [0, 0, 1, 2, 3, 2, 3, 2, 1, 0, 0],
    [0, 0, 0, 1, 2, 3, 2, 1, 0, 0, 0],
    [0, 0, 0, 1, 2, 3, 2, 1, 0, 0, 0],
    [0, 0, 1, 2, 3, 2, 3, 2, 1, 0, 0],
    [0, 1, 2, 2, 3, 1, 3, 2, 2, 1, 0],
    [1, 2, 2, 2, 3, 1, 3, 2, 2, 2, 1],
    [1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1],
  ],
  // Pattern 6: Hyper Crosshair (11 rows x 11 cols)
  [
    [0, 0, 0, 1, 2, 3, 2, 1, 0, 0, 0],
    [0, 0, 0, 1, 2, 3, 2, 1, 0, 0, 0],
    [0, 0, 1, 2, 3, 1, 3, 2, 1, 0, 0],
    [1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1],
    [2, 2, 3, 1, 2, 4, 2, 1, 3, 2, 2],
    [3, 3, 1, 2, 1, 3, 1, 2, 1, 3, 3],
    [2, 2, 3, 1, 2, 4, 2, 1, 3, 2, 2],
    [1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1],
    [0, 0, 1, 2, 3, 1, 3, 2, 1, 0, 0],
    [0, 0, 0, 1, 2, 3, 2, 1, 0, 0, 0],
    [0, 0, 0, 1, 2, 3, 2, 1, 0, 0, 0],
  ],
  // Pattern 7: Great Pyramid of Vega (10 rows x 11 cols)
  [
    [0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
    [0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0],
    [0, 0, 1, 1, 1, 3, 1, 1, 1, 0, 0],
    [0, 1, 2, 2, 2, 3, 2, 2, 2, 1, 0],
    [1, 2, 3, 3, 3, 3, 3, 3, 3, 2, 1],
    [1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1],
    [2, 2, 2, 3, 3, 3, 3, 3, 2, 2, 2],
    [3, 3, 3, 1, 1, 1, 1, 1, 3, 3, 3],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Pattern 8: Cosmic Honeycomb Grid (10 rows x 11 cols)
  [
    [1, 0, 2, 0, 3, 0, 3, 0, 2, 0, 1],
    [0, 2, 0, 3, 0, 4, 0, 3, 0, 2, 0],
    [1, 0, 3, 0, 2, 0, 2, 0, 3, 0, 1],
    [0, 3, 0, 2, 0, 3, 0, 2, 0, 3, 0],
    [1, 0, 2, 0, 3, 0, 3, 0, 2, 0, 1],
    [0, 2, 0, 3, 0, 2, 0, 3, 0, 2, 0],
    [1, 0, 3, 0, 2, 0, 2, 0, 3, 0, 1],
    [0, 3, 0, 2, 0, 4, 0, 2, 0, 3, 0],
    [1, 0, 2, 0, 3, 0, 3, 0, 2, 0, 1],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  ],
  // Pattern 9: Solar Corona (11 rows x 11 cols)
  [
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 3],
    [3, 1, 2, 2, 2, 3, 2, 2, 2, 1, 3],
    [3, 1, 2, 3, 3, 4, 3, 3, 2, 1, 3],
    [3, 1, 2, 3, 1, 1, 1, 3, 2, 1, 3],
    [3, 2, 3, 1, 1, 2, 1, 1, 3, 2, 3],
    [3, 1, 2, 3, 1, 1, 1, 3, 2, 1, 3],
    [3, 1, 2, 3, 3, 4, 3, 3, 2, 1, 3],
    [3, 1, 2, 2, 2, 3, 2, 2, 2, 1, 3],
    [3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  ],
];

/**
 * SEPARATE TEST FUNCTION:
 * Procedurally generates endless random levels when progressing beyond Sector 50.
 * Can be cleanly isolated or reverted as requested.
 */
export function generateEndlessRandomLevel(levelId: number): LevelConfig {
  const bricks: Brick[] = [];

  const bW = 0.45;
  const bH = 0.24;
  const bD = 0.35;
  const sX = 0.04;
  const sY = 0.04;
  const startY = 7.7;

  const basePlanet = PLANETS[(levelId - 1) % PLANETS.length];
  const planetName = `${basePlanet} (Endless Core)`;
  const themeColor = THEME_COLORS[(levelId - 1) % THEME_COLORS.length];
  const name = `Sector ${levelId} (Endless)`;

  // Pick pattern procedurally
  const patternIndex = (levelId - 1) % PATTERNS.length;
  const baseLayout = PATTERNS[patternIndex];

  const rows = baseLayout.length;
  const cols = baseLayout[0].length;
  const startX = -((cols * (bW + sX)) / 2) + bW / 2 + sX / 2;

  let explosiveCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let cell = baseLayout[r][c];

      // Procedural variations for post-50 testing mode
      if (cell === 0 && (r === 0 || r === rows - 1) && Math.random() < 0.3) {
        cell = 1;
      }

      if (cell === 0) continue;

      const posX = startX + c * (bW + sX);
      const posY = startY - r * (bH + sY);

      let color = themeColor;
      let type: Brick["type"] = "normal";
      let hp = 1;
      let points = 100;

      if (cell === 4) {
        if (explosiveCount < 2) {
          explosiveCount++;
          color = "#F43F5E";
          type = "explosive";
          hp = 1;
          points = 250;
        } else {
          cell = 2;
        }
      }

      if (cell === 2) {
        color = "#F8FAFC";
        points = 150;
      } else if (cell === 3) {
        color = "#94A3B8";
        type = "armored";
        hp = 3;
        points = 300;
      }

      bricks.push({
        id: `b_endless_${r}_${c}`,
        x: posX,
        y: posY,
        z: 0,
        width: bW,
        height: bH,
        depth: bD,
        type,
        hp,
        maxHp: hp,
        color,
        glowColor: color,
        points,
        powerUp: getRandomPowerUp(0.08),
        isAlive: true,
      });
    }
  }

  return {
    id: levelId,
    name,
    planetName,
    rows,
    cols,
    bricks,
    themeColor,
    targetScore: bricks.length * 150,
  };
}

export function generateLevel(levelId: number): LevelConfig {
  if (levelId > 50) {
    return generateEndlessRandomLevel(levelId);
  }

  const bricks: Brick[] = [];

  // Compact, high-density brick dimensions fitting within screen bounds (-2.8 to +2.8)
  const bW = 0.45;
  const bH = 0.24;
  const bD = 0.35;
  const sX = 0.04;
  const sY = 0.04;
  const startY = 7.7;

  const planetIdx = (levelId - 1) % PLANETS.length;
  const planetName = PLANETS[planetIdx];
  const themeColor = THEME_COLORS[(levelId - 1) % THEME_COLORS.length];
  const name = `Sector ${levelId}`;

  // Pick layout pattern based on level ID
  const patternIndex = (levelId - 1) % PATTERNS.length;
  const layout = PATTERNS[patternIndex];

  const rows = layout.length;
  const cols = layout[0].length;
  const startX = -((cols * (bW + sX)) / 2) + bW / 2 + sX / 2;

  // Higher levels increase armor HP
  const armorHpIncrease = levelId > 15 ? (levelId > 30 ? 3 : 2) : 2;

  let explosiveCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let cell = layout[r][c];

      // For higher levels, fill empty slots near borders to increase density further
      if (
        cell === 0 &&
        levelId > 10 &&
        (r === 0 || r === rows - 1) &&
        Math.random() < 0.4
      ) {
        cell = 1;
      }

      if (cell === 0) continue;

      const posX = startX + c * (bW + sX);
      const posY = startY - r * (bH + sY);

      let color = themeColor;
      let type: Brick["type"] = "normal";
      let hp = 1;
      let points = 100;

      // Limit explosive bricks to max 2 per level layout
      if (cell === 4) {
        if (explosiveCount < 2) {
          explosiveCount++;
          color = "#F43F5E";
          type = "explosive";
          hp = 1;
          points = 250;
        } else {
          cell = 2;
        }
      }

      if (cell === 2) {
        color = "#F8FAFC";
        points = 150;
      } else if (cell === 3) {
        color = "#94A3B8";
        type = "armored";
        hp = armorHpIncrease;
        points = 300;
      }

      bricks.push({
        id: `b_${r}_${c}`,
        x: posX,
        y: posY,
        z: 0,
        width: bW,
        height: bH,
        depth: bD,
        type,
        hp,
        maxHp: hp,
        color,
        glowColor: color,
        points,
        powerUp: getRandomPowerUp(0.08),
        isAlive: true,
      });
    }
  }

  return {
    id: levelId,
    name,
    planetName,
    rows,
    cols,
    bricks,
    themeColor,
    targetScore: bricks.length * 150,
  };
}
