export type BrickType =
  | "normal"
  | "armored"
  | "explosive"
  | "speed"
  | "unbreakable"
  | "powerup";

export type PowerUpType = "wide_paddle" | "multi_ball" | "shield";
// | "slow_motion";

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Brick {
  id: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  type: BrickType;
  hp: number;
  maxHp: number;
  color: string;
  glowColor: string;
  points: number;
  powerUp?: PowerUpType;
  isAlive: boolean;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  speed: number;
  isFireball?: boolean;
  spin?: number;
}

export interface Paddle {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  targetX: number;
  startX?: number;
  isWide?: boolean;
}

export interface DroppedPowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  z: number;
  vy: number;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
}

export interface FlyingCoin {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
}

export type GameStatus = "MENU" | "PLAYING" | "PAUSED" | "GAMEOVER" | "VICTORY";

export interface LevelConfig {
  id: number;
  name: string;
  planetName: string;
  rows: number;
  cols: number;
  bricks: Brick[];
  themeColor: string;
  targetScore: number;
}
