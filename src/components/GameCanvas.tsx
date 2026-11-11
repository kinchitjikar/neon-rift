import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  PanResponder,
  Dimensions,
  Text,
  Image,
} from "react-native";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import * as THREE from "three";
import {
  Ball,
  Brick,
  DroppedPowerUp,
  FloatingText,
  FlyingCoin,
  GameStatus,
  LevelConfig,
  Paddle,
  Particle,
  PowerUpType,
} from "../types/game";
import { soundManager } from "../audio/soundManager";
import { adManager } from "../utils/adManager";
import { COLORS } from "../config/theme";
import { WallpaperItem, getWallpaperByIndex } from "../config/wallpapers";
import * as Haptics from "expo-haptics";
import { FEATURES } from "../config/features";

import { PerkSVGIcon } from "./PerkSVGIcon";

interface GameCanvasProps {
  level: LevelConfig;
  gameStatus: GameStatus;
  score: number;
  lives: number;
  wallpaper?: WallpaperItem;
  onScoreChange: (score: number, combo: number) => void;
  onLifeChange: (lives: number) => void;
  onGameOver: () => void;
  onVictory: () => void;
  onActivePowerUp: (type: PowerUpType) => void;
  onRewardCoins: (amount: number) => void;
}

const ARENA_BOUNDS = {
  left: -2.8,
  right: 2.8,
  top: 9.0,
  bottom: -5.4,
};

const sharedCoinGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.04, 12);
const sharedCoinMat = new THREE.MeshStandardMaterial({
  color: 0xfacc15,
  emissive: 0xca8a04,
  emissiveIntensity: 0.6,
  metalness: 0.9,
  roughness: 0.1,
});

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  gameStatus,
  score,
  lives,
  wallpaper,
  onScoreChange,
  onLifeChange,
  onGameOver,
  onVictory,
  onActivePowerUp,
  onRewardCoins,
}) => {
  // Game State Refs
  const bricksRef = useRef<Brick[]>([]);
  const ballsRef = useRef<Ball[]>([]);
  const paddleRef = useRef<Paddle>({
    x: 0,
    y: -2.6,
    z: 0,
    width: 2.0,
    height: 0.45,
    depth: 0.55,
    targetX: 0,
    startX: 0,
  });
  const powerUpsRef = useRef<DroppedPowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const activeEffectsRef = useRef<{ [key in PowerUpType]?: number }>({});
  const shakeIntensityRef = useRef(0);

  // Lifecycle, animation frame & cleanup refs to prevent ghost loops and timer leaks
  const isMountedRef = useRef(true);
  const animationFrameIdRef = useRef<number | null>(null);
  const respawnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // CRITICAL FIX: Initialization & Victory triggers to prevent repeated modal popups
  const isBallInitializedRef = useRef(false);
  const isRespawningRef = useRef(false);
  const isBallStuckRef = useRef(true);
  const hasTriggeredVictoryRef = useRef(false);
  const lastLaunchTimeRef = useRef<number>(0);
  const speedBoostStepRef = useRef<number>(0);

  // Three.js Scene, Brick Map, and PowerUp Map Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const brickMeshMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const powerUpMeshMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const paddleVelocityRef = useRef<number>(0);

  // Mount/Unmount cleanup to cancel active RAF loops and clear pending timers
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (respawnTimeoutRef.current !== null) {
        clearTimeout(respawnTimeoutRef.current);
        respawnTimeoutRef.current = null;
      }
    };
  }, []);

  // Floating text & coin animations
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [flyingCoins, setFlyingCoins] = useState<FlyingCoin[]>([]);
  const [respawnText, setRespawnText] = useState<string | null>(null);

  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const comboRef = useRef(0);
  const gameStatusRef = useRef(gameStatus);
  const shieldActiveRef = useRef(false);

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const getMaxPaddleX = (paddleWidth: number) => {
    return ARENA_BOUNDS.right - paddleWidth / 2;
  };

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    livesRef.current = lives;
    gameStatusRef.current = gameStatus;
    if (lives > 0 && gameStatus === "PLAYING") {
      if (ballsRef.current.length === 0 || isRespawningRef.current) {
        resetBallAndPaddle();
      }
    }
  }, [lives, gameStatus]);

  // Load level bricks
  useEffect(() => {
    hasTriggeredVictoryRef.current = false; // Reset victory trigger on new level!
    bricksRef.current = JSON.parse(JSON.stringify(level.bricks));
    resetBallAndPaddle();

    if (sceneRef.current) {
      loadLevelBricksIntoScene(sceneRef.current);
    }
  }, [level]);

  const loadLevelBricksIntoScene = (scene: THREE.Scene) => {
    brickMeshMapRef.current.forEach((group) => {
      scene.remove(group);
    });
    brickMeshMapRef.current.clear();

    bricksRef.current.forEach((b) => {
      const group = createBrickMeshGroup(b);
      scene.add(group);
      brickMeshMapRef.current.set(b.id, group);
    });
  };

  const resetBallAndPaddle = () => {
    if (respawnTimeoutRef.current !== null) {
      clearTimeout(respawnTimeoutRef.current);
      respawnTimeoutRef.current = null;
    }
    activeEffectsRef.current = {};
    powerUpsRef.current = [];
    particlesRef.current = [];
    if (sceneRef.current) {
      powerUpMeshMapRef.current.forEach((group) => {
        sceneRef.current?.remove(group);
      });
      powerUpMeshMapRef.current.clear();
      flyingCoinsRef.current.forEach((fc) => {
        sceneRef.current?.remove(fc.group);
      });
      flyingCoinsRef.current = [];
    }
    setFloatingTexts([]);
    comboRef.current = 0;
    lastLaunchTimeRef.current = 0;
    speedBoostStepRef.current = 0;
    lastFrameTimeRef.current = 0;
    paddleRef.current.x = 0;
    paddleRef.current.targetX = 0;
    paddleRef.current.width = 2.0;

    const p = paddleRef.current;
    const initialY = p.y + p.height / 2 + 0.17;

    ballsRef.current = [
      {
        id: `ball_${Math.random()}`,
        x: p.x,
        y: initialY,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 0.17,
        speed: 0.12,
        spin: 0,
      },
    ];

    isBallStuckRef.current = true;
    setRespawnText("TAP SCREEN TO LAUNCH 🚀");
    isRespawningRef.current = false;
    isBallInitializedRef.current = true;
  };

  const launchBallIfStuck = () => {
    if (isBallStuckRef.current && ballsRef.current.length > 0) {
      isBallStuckRef.current = false;
      setRespawnText(null);
      lastLaunchTimeRef.current = Date.now();
      speedBoostStepRef.current = 0;
      lastFrameTimeRef.current = Date.now();
      const isEndgame =
        bricksRef.current.length <= 10 && bricksRef.current.length > 0;
      const baseSpeed = isEndgame ? 0.20 : 0.12;
      const angle = (Math.PI / 4) * (Math.random() > 0.5 ? 1 : -1);
      ballsRef.current.forEach((ball) => {
        ball.vx = Math.sin(angle) * baseSpeed;
        ball.vy = Math.cos(angle) * baseSpeed;
        ball.speed = baseSpeed;
      });
      soundManager.playHitPaddle();
    }
  };

  // Smooth Direct Finger Touch Tracking
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        paddleRef.current.startX = paddleRef.current.targetX;
        launchBallIfStuck();
      },
      onPanResponderMove: (_, gestureState) => {
        launchBallIfStuck();
        const pWidth = paddleRef.current.width;
        const maxBound = getMaxPaddleX(pWidth);
        const arenaWidth = maxBound * 2;
        const deltaX = (gestureState.dx / screenWidth) * arenaWidth * 2.10;
        let newX = (paddleRef.current.startX || 0) + deltaX;
        newX = Math.max(-maxBound, Math.min(maxBound, newX));
        paddleRef.current.targetX = newX;
      },
      onPanResponderRelease: () => {
        launchBallIfStuck();
      },
    })
  ).current;

  interface FlyingCoinMesh {
    id: string;
    group: THREE.Group;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    progress: number;
  }

  const flyingCoinsRef = useRef<FlyingCoinMesh[]>([]);

  const addFloatingText = (
    text: string,
    x: number,
    y: number,
    color = COLORS.accent
  ) => {
    const safeColor = color || COLORS.accent;
    const id = `ft_${Math.random()}`;
    const screenX = (x / 4.2) * (screenWidth / 2) + screenWidth / 2;
    const screenY = (-y / 8.5) * (screenHeight / 2) + screenHeight / 2;

    setFloatingTexts((prev) => {
      const updated = [
        ...prev,
        { id, text, x: screenX, y: screenY, color: safeColor, alpha: 1, scale: 1 },
      ];
      return updated.slice(-6);
    });
  };

  const addFlyingCoin = (x: number, y: number) => {
    if (sceneRef.current) {
      if (flyingCoinsRef.current.length < 6) {
        const mesh = new THREE.Mesh(sharedCoinGeo, sharedCoinMat);
        mesh.rotation.x = Math.PI / 2;
        const coinGroup = new THREE.Group();
        coinGroup.add(mesh);
        coinGroup.position.set(x, y, 0.2);
        sceneRef.current.add(coinGroup);

        flyingCoinsRef.current.push({
          id: `fc_${Math.random()}`,
          group: coinGroup,
          startX: x,
          startY: y,
          targetX: -3.0,
          targetY: 8.5,
          progress: 0,
        });
      }
    }
    onRewardCoins(10);
  };

  const createBrickMeshGroup = (b: Brick) => {
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(b.width, b.height, b.depth);

    const safeColor = b.color || "#38BDF8";
    let matColor = new THREE.Color(safeColor);
    let emissiveColor = new THREE.Color(safeColor);

    if (b.type === "armored") {
      matColor = new THREE.Color(0x94a3b8);
      emissiveColor = new THREE.Color(0x475569);
    } else if (b.type === "explosive") {
      matColor = new THREE.Color(0xf43f5e);
      emissiveColor = new THREE.Color(0xef4444);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: matColor,
      emissive: emissiveColor,
      emissiveIntensity: b.type === "explosive" ? 0.5 : 0.25,
      metalness: 0.7,
      roughness: 0.2,
    });

    const mainMesh = new THREE.Mesh(geo, mat);
    group.add(mainMesh);

    const edgesGeo = new THREE.EdgesGeometry(geo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
    const lineOverlay = new THREE.LineSegments(edgesGeo, edgesMat);
    group.add(lineOverlay);

    if (b.type === "armored") {
      const rivetGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const rivetMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
      });
      const r1 = new THREE.Mesh(rivetGeo, rivetMat);
      r1.position.set(-b.width / 2 + 0.08, 0, b.depth / 2 + 0.01);
      group.add(r1);

      const r2 = new THREE.Mesh(rivetGeo, rivetMat);
      r2.position.set(b.width / 2 - 0.08, 0, b.depth / 2 + 0.01);
      group.add(r2);
    }

    group.position.set(b.x, b.y, b.z);
    return group;
  };

  // WebGL & Three.js Scene Setup
  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const scene = new THREE.Scene();
    // Scene background left unset (null) to allow transparent WebGL rendering over ImageBackground
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 100);
    const defaultCamPos = new THREE.Vector3(0, -1.0, 14.2);
    camera.position.copy(defaultCamPos);
    camera.lookAt(0, 1.8, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: {
        width,
        height,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: height,
        clientWidth: width,
      } as unknown as HTMLCanvasElement,
      context: gl,
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);

    const ambientLight = new THREE.AmbientLight(0xf8fafc, 0.85);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 12, 10);
    scene.add(mainLight);

    const cyanPointLight = new THREE.PointLight(0x22d3ee, 1.5, 20);
    cyanPointLight.position.set(-4, -2, 4);
    scene.add(cyanPointLight);

    // Portal Energy Rings
    const ringGeo = new THREE.TorusGeometry(0.55, 0.09, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.4,
      metalness: 0.8,
    });
    const leftRing = new THREE.Mesh(ringGeo, ringMat);
    leftRing.position.set(-3.2, 3.5, 0);
    scene.add(leftRing);

    const rightRing = new THREE.Mesh(ringGeo, ringMat);
    rightRing.position.set(3.2, 3.5, 0);
    scene.add(rightRing);

    // Arena Side Frame
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.15,
      metalness: 0.95,
      roughness: 0.1,
    });

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 18, 1),
      wallMaterial
    );
    leftWall.position.set(-3.65, 1, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 18, 1),
      wallMaterial
    );
    rightWall.position.set(3.65, 1, 0);
    scene.add(rightWall);

    const topWall = new THREE.Mesh(
      new THREE.BoxGeometry(7.6, 0.25, 1),
      wallMaterial
    );
    topWall.position.set(0, 9.15, 0);
    scene.add(topWall);

    // Shield Mesh
    const shieldGeometry = new THREE.BoxGeometry(7.4, 0.25, 0.4);
    const shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x34d399,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.0,
    });
    const shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shieldMesh.position.set(0, -5.1, 0);
    scene.add(shieldMesh);

    // Metallic Capsule Paddle
    const paddleGroup = new THREE.Group();
    scene.add(paddleGroup);

    const centerBodyGeo = new THREE.BoxGeometry(1, 0.4, 0.5);
    const centerBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0x334155,
      emissiveIntensity: 0.4,
      metalness: 0.95,
      roughness: 0.1,
    });
    const centerBodyMesh = new THREE.Mesh(centerBodyGeo, centerBodyMat);
    paddleGroup.add(centerBodyMesh);

    const capGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.5, 16);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.7,
    });

    const leftCap = new THREE.Mesh(capGeo, capMat);
    leftCap.rotation.x = Math.PI / 2;
    leftCap.position.set(-0.5, 0, 0);
    paddleGroup.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, capMat);
    rightCap.rotation.x = Math.PI / 2;
    rightCap.position.set(0.5, 0, 0);
    paddleGroup.add(rightCap);

    loadLevelBricksIntoScene(scene);

    // High-Contrast Electric Sphere Ball
    const ballMeshMap = new Map<
      string,
      { mesh: THREE.Mesh; light: THREE.PointLight }
    >();
    const ballGeo = new THREE.SphereGeometry(0.17, 32, 32);

    const updateBallMeshes = () => {
      const currentIds = new Set(ballsRef.current.map((b) => b.id));

      ballMeshMap.forEach((val, id) => {
        if (!currentIds.has(id)) {
          scene.remove(val.mesh);
          scene.remove(val.light);
          ballMeshMap.delete(id);
        }
      });

      ballsRef.current.forEach((b) => {
        if (!ballMeshMap.has(b.id)) {
          const mat = new THREE.MeshStandardMaterial({
            color: b.isFireball ? 0xef4444 : 0xffffff,
            emissive: b.isFireball ? 0xf43f5e : 0xf8fafc,
            emissiveIntensity: 0.85,
            metalness: 0.3,
            roughness: 0.05,
          });
          const mesh = new THREE.Mesh(ballGeo, mat);
          const light = new THREE.PointLight(
            b.isFireball ? 0xef4444 : 0x22d3ee,
            1.5,
            6
          );
          scene.add(mesh);
          scene.add(light);
          ballMeshMap.set(b.id, { mesh, light });
        }

        const item = ballMeshMap.get(b.id)!;
        item.mesh.position.set(b.x, b.y, b.z);
        item.light.position.set(b.x, b.y, b.z + 0.3);
      });
    };

    // Hardware-Accelerated 60FPS 3D Glowing Perk Mesh Renderer
    const powerUpMeshMap = powerUpMeshMapRef.current;
    const perkCoreGeo = new THREE.IcosahedronGeometry(0.25, 1);
    const perkRingGeo = new THREE.TorusGeometry(0.35, 0.06, 12, 24);

    const updatePowerUpMeshes = () => {
      const currentIds = new Set(powerUpsRef.current.map((p) => p.id));
      powerUpMeshMap.forEach((group, id) => {
        if (!currentIds.has(id)) {
          scene.remove(group);
          powerUpMeshMap.delete(id);
        }
      });

      powerUpsRef.current.forEach((p) => {
        if (!powerUpMeshMap.has(p.id)) {
          const newGroup = new THREE.Group();
          const safeColor = p.color || "#38BDF8";
          const hexColor = parseInt(safeColor.replace("#", "0x"), 16);

          const coreMat = new THREE.MeshStandardMaterial({
            color: hexColor,
            emissive: hexColor,
            emissiveIntensity: 0.95,
            metalness: 0.8,
            roughness: 0.1,
          });
          const coreMesh = new THREE.Mesh(perkCoreGeo, coreMat);
          newGroup.add(coreMesh);

          const ringMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: hexColor,
            emissiveIntensity: 1.0,
          });
          const ringMesh = new THREE.Mesh(perkRingGeo, ringMat);
          newGroup.add(ringMesh);

          const light = new THREE.PointLight(hexColor, 1.8, 3);
          newGroup.add(light);

          scene.add(newGroup);
          powerUpMeshMap.set(p.id, newGroup);
        }

        const group = powerUpMeshMap.get(p.id)!;
        group.position.set(p.x, p.y, p.z);
        group.rotation.y += 0.08;
        group.rotation.z += 0.04;
      });
    };

    // Ultra High-Performance 1-Draw-Call Instanced Particles
    const MAX_PARTICLES = 120;
    const particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const particleInstancedMesh = new THREE.InstancedMesh(
      particleGeo,
      particleMat,
      MAX_PARTICLES
    );
    particleInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(particleInstancedMesh);

    const dummyParticleObj = new THREE.Object3D();
    const particleTempColor = new THREE.Color();

    // Reusable Blast Shockwave Ring
    const blastRingGeo = new THREE.RingGeometry(0.2, 0.6, 24);
    const blastRingMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    });
    const blastRingMesh = new THREE.Mesh(blastRingGeo, blastRingMat);
    blastRingMesh.position.set(0, 0, 0.1);
    scene.add(blastRingMesh);

    let blastRingScale = 1.0;
    let blastRingOpacity = 0.0;

    const spawnBlastShockwave = (x: number, y: number, color = "#FF0055") => {
      blastRingMesh.position.set(x, y, 0.1);
      blastRingMat.color.set(color || "#FF0055");
      blastRingScale = 1.0;
      blastRingOpacity = 1.0;
      blastRingMesh.scale.set(1.0, 1.0, 1.0);
      blastRingMat.opacity = 1.0;
    };

    const updateParticles = () => {
      const aliveParticles: Particle[] = [];
      const len = particlesRef.current.length;

      for (let i = 0; i < len; i++) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.life += 1;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life < p.maxLife && aliveParticles.length < MAX_PARTICLES) {
          aliveParticles.push(p);
          const idx = aliveParticles.length - 1;
          dummyParticleObj.position.set(p.x, p.y, p.z);
          const scale = Math.max(0.01, p.alpha * (p.size / 0.12));
          dummyParticleObj.scale.set(scale, scale, scale);
          dummyParticleObj.updateMatrix();
          particleInstancedMesh.setMatrixAt(idx, dummyParticleObj.matrix);
          particleTempColor.set(p.color || "#FFFFFF");
          particleInstancedMesh.setColorAt(idx, particleTempColor);
        }
      }

      for (let i = aliveParticles.length; i < MAX_PARTICLES; i++) {
        dummyParticleObj.scale.set(0, 0, 0);
        dummyParticleObj.updateMatrix();
        particleInstancedMesh.setMatrixAt(i, dummyParticleObj.matrix);
      }

      particleInstancedMesh.count = MAX_PARTICLES;
      particleInstancedMesh.instanceMatrix.needsUpdate = true;
      if (particleInstancedMesh.instanceColor) {
        particleInstancedMesh.instanceColor.needsUpdate = true;
      }

      particlesRef.current = aliveParticles;
    };

    const spawnParticles = (
      x: number,
      y: number,
      color = "#FFFFFF",
      count = 10
    ) => {
      const safeColor = color || "#FFFFFF";
      if (particlesRef.current.length + count > MAX_PARTICLES) {
        particlesRef.current.splice(0, count);
      }
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.05 + Math.random() * 0.12;
        particlesRef.current.push({
          id: `p_${Math.random()}`,
          x,
          y,
          z: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          vz: (Math.random() - 0.5) * 0.08,
          size: 0.12,
          color: safeColor,
          alpha: 1,
          life: 0,
          maxLife: 16 + Math.floor(Math.random() * 10),
        });
      }
    };

    const triggerExplosionRadius = (
      centerX: number,
      centerY: number,
      radius = 2.4
    ) => {
      shakeIntensityRef.current = 0.3;
      spawnBlastShockwave(centerX, centerY, "#FF0055");
      spawnParticles(centerX, centerY, "#FF0055", 16);
      addFlyingCoin(centerX, centerY);

      const remaining: Brick[] = [];
      bricksRef.current.forEach((targetBrick) => {
        const dist = Math.hypot(
          targetBrick.x - centerX,
          targetBrick.y - centerY
        );
        if (dist <= radius) {
          targetBrick.hp = 0;
          targetBrick.isAlive = false;

          const group = brickMeshMapRef.current.get(targetBrick.id);
          if (group) {
            scene.remove(group);
            brickMeshMapRef.current.delete(targetBrick.id);
          }

          comboRef.current += 1;
          const earnedScore = targetBrick.points * comboRef.current;
          onScoreChange(scoreRef.current + earnedScore, comboRef.current);
          spawnParticles(targetBrick.x, targetBrick.y, targetBrick.color, 4);
        } else {
          remaining.push(targetBrick);
        }
      });
      bricksRef.current = remaining;

      // When remaining bricks drop to 10 or fewer, immediately scale ball speed to 0.20
      if (remaining.length <= 10 && remaining.length > 0) {
        ballsRef.current.forEach((b) => {
          const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          if (spd > 0 && Math.abs(spd - 0.20) > 0.001) {
            const ratio = 0.20 / spd;
            b.vx *= ratio;
            b.vy *= ratio;
            b.speed = 0.20;
          }
        });
      }
    };

    // MAIN RENDER & PHYSICS LOOP
    const render = () => {
      if (!isMountedRef.current) return;
      animationFrameIdRef.current = requestAnimationFrame(render);

      const now = Date.now();
      const deltaMs =
        lastFrameTimeRef.current > 0 ? now - lastFrameTimeRef.current : 16.667;
      lastFrameTimeRef.current = now;
      const timeScale = Math.min(2.0, Math.max(0.5, deltaMs / 16.667));

      leftRing.rotation.z += 0.02 * timeScale;
      rightRing.rotation.z += 0.02 * timeScale;

      // Update blast shockwave ring
      if (blastRingOpacity > 0.01) {
        blastRingScale += 0.25 * timeScale;
        blastRingOpacity -= 0.06 * timeScale;
        blastRingMesh.scale.set(blastRingScale, blastRingScale, 1);
        blastRingMat.opacity = Math.max(0, blastRingOpacity);
      } else if (blastRingMat.opacity > 0) {
        blastRingMat.opacity = 0;
      }

      if (shakeIntensityRef.current > 0.005) {
        camera.position.x =
          defaultCamPos.x + (Math.random() - 0.5) * shakeIntensityRef.current;
        camera.position.y =
          defaultCamPos.y + (Math.random() - 0.5) * shakeIntensityRef.current;
        shakeIntensityRef.current *= 0.88;
      } else {
        camera.position.copy(defaultCamPos);
      }

      if (gameStatusRef.current === "PLAYING") {
        const p = paddleRef.current;
        const maxBound = getMaxPaddleX(p.width);
        p.targetX = Math.max(-maxBound, Math.min(maxBound, p.targetX));
        const prevPaddleX = p.x;
        p.x += (p.targetX - p.x) * Math.min(1.0, 0.55 * timeScale);
        paddleVelocityRef.current = (p.x - prevPaddleX) / (timeScale || 1);

        paddleGroup.position.set(p.x, p.y, p.z);
        centerBodyMesh.scale.set(p.width, 1, 1);
        leftCap.position.set(-(p.width / 2), 0, 0);
        rightCap.position.set(p.width / 2, 0, 0);

        const isShieldActive = !!(
          activeEffectsRef.current["shield"] &&
          activeEffectsRef.current["shield"]! > now
        );
        shieldActiveRef.current = isShieldActive;
        (shieldMesh.material as THREE.MeshStandardMaterial).opacity =
          isShieldActive ? 0.85 : 0.0;

        (leftCap.material as THREE.MeshStandardMaterial).emissive.setHex(
          0xff0055
        );
        (
          leftCap.material as THREE.MeshStandardMaterial
        ).emissiveIntensity = 0.9;
        (rightCap.material as THREE.MeshStandardMaterial).emissive.setHex(
          0xff0055
        );
        (
          rightCap.material as THREE.MeshStandardMaterial
        ).emissiveIntensity = 0.9;

        const remainingPowerUps: DroppedPowerUp[] = [];
        powerUpsRef.current.forEach((pup) => {
          pup.y += pup.vy * timeScale;

          const halfPW = p.width / 2;
          const halfPH = p.height / 2;

          // Check if powerup lands directly on paddle
          const isHittingPaddle =
            pup.y <= p.y + halfPH + 0.25 &&
            pup.y >= p.y - halfPH - 0.20 &&
            pup.x >= p.x - halfPW - 0.25 &&
            pup.x <= p.x + halfPW + 0.25;

          if (isHittingPaddle) {
            soundManager.playPowerUp();
            activatePowerUp(pup.type);
            spawnParticles(pup.x, p.y + halfPH, pup.color, 20);
            addFloatingText(
              `${pup.type.toUpperCase().replace("_", " ")}!`,
              pup.x,
              p.y + halfPH,
              pup.color
            );
            // Immediately remove 3D mesh from Three.js scene so animation halts right at paddle
            const group = powerUpMeshMap.get(pup.id);
            if (group) {
              scene.remove(group);
              powerUpMeshMap.delete(pup.id);
            }
          } else if (pup.y > -5.5) {
            // Still in active play area, keep falling
            remainingPowerUps.push(pup);
          } else {
            // Missed powerup fell below screen bounds, remove mesh
            const group = powerUpMeshMap.get(pup.id);
            if (group) {
              scene.remove(group);
              powerUpMeshMap.delete(pup.id);
            }
          }
        });
        powerUpsRef.current = remainingPowerUps;

        // Ball Speed Logic: Check for final 10 bricks endgame vs time-based escalation
        const isEndgame =
          bricksRef.current.length <= 10 && bricksRef.current.length > 0;

        if (!isBallStuckRef.current && lastLaunchTimeRef.current > 0) {
          if (isEndgame) {
            // Final 10 bricks threshold: lock speed to 0.20
            ballsRef.current.forEach((b) => {
              const curSpd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
              if (curSpd > 0 && Math.abs(curSpd - 0.20) > 0.001) {
                const ratio = 0.20 / curSpd;
                b.vx *= ratio;
                b.vy *= ratio;
              }
              b.speed = 0.20;
            });
          } else {
            // Time-Based Progressive Speed Escalation (Increases every 5 seconds from 0.12 up to 0.18)
            const elapsedSec = (Date.now() - lastLaunchTimeRef.current) / 1000;
            const currentStep = Math.floor(elapsedSec / 5);
            const targetMinSpeed = Math.min(0.18, 0.12 + currentStep * 0.012);

            if (currentStep > speedBoostStepRef.current) {
              speedBoostStepRef.current = currentStep;
            }

            ballsRef.current.forEach((b) => {
              const curSpd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
              if (curSpd > 0 && curSpd < targetMinSpeed) {
                const ratio = targetMinSpeed / curSpd;
                b.vx *= ratio;
                b.vy *= ratio;
              }
            });
          }
        }

        const activeBalls: Ball[] = [];

        ballsRef.current.forEach((ball) => {
          if (isBallStuckRef.current) {
            ball.x = p.x;
            ball.y = p.y + p.height / 2 + ball.radius;
            activeBalls.push(ball);
            return;
          }

          // Option A: 1. Precision Curve Strike Magnus Curvature
          if (
            FEATURES.ENABLE_CURVE_STRIKE &&
            ball.spin &&
            Math.abs(ball.spin) > 0.01
          ) {
            const curSpd =
              Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) || ball.speed;
            const perpX = -ball.vy / curSpd;
            const perpY = ball.vx / curSpd;
            const curveMagnitude = ball.spin * 0.007 * timeScale;
            ball.vx += perpX * curveMagnitude;
            ball.vy += perpY * curveMagnitude;

            // Renormalize velocity to strictly preserve ball speed rules
            const newSpd =
              Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) || ball.speed;
            const scale = curSpd / newSpd;
            ball.vx *= scale;
            ball.vy *= scale;

            ball.spin *= Math.pow(0.965, timeScale);
            if (Math.abs(ball.spin) < 0.01) {
              ball.spin = 0;
            }

            if (Math.random() < 0.25) {
              spawnParticles(
                ball.x,
                ball.y,
                ball.spin > 0 ? "#22D3EE" : "#F472B6",
                1
              );
            }
          }

          let nx = ball.x + ball.vx * timeScale;
          let ny = ball.y + ball.vy * timeScale;

          // Wall Collisions
          if (nx - ball.radius <= ARENA_BOUNDS.left) {
            nx = ARENA_BOUNDS.left + ball.radius;
            ball.vx = Math.abs(ball.vx);
            soundManager.playHitBrick(300);
          } else if (nx + ball.radius >= ARENA_BOUNDS.right) {
            nx = ARENA_BOUNDS.right - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            soundManager.playHitBrick(300);
          }

          if (ny + ball.radius >= ARENA_BOUNDS.top) {
            ny = ARENA_BOUNDS.top - ball.radius;
            ball.vy = -Math.abs(ball.vy);
            soundManager.playHitBrick(320);
          }

          // Strict Paddle Collision
          const halfPWidth = p.width / 2;
          const halfPHeight = p.height / 2;

          if (
            ny - ball.radius <= p.y + halfPHeight &&
            ny + ball.radius >= p.y - halfPHeight &&
            nx >= p.x - halfPWidth &&
            nx <= p.x + halfPWidth &&
            ball.vy < 0
          ) {
            ny = p.y + halfPHeight + ball.radius;
            const hitFactor = (nx - p.x) / halfPWidth;
            const maxAngle = (Math.PI / 180) * 60;
            const bounceAngle = hitFactor * maxAngle;

            const isEndgame =
              bricksRef.current.length <= 10 && bricksRef.current.length > 0;

            let speed: number;
            if (isEndgame) {
              speed = 0.20;
            } else {
              const elapsedSec =
                lastLaunchTimeRef.current > 0
                  ? (Date.now() - lastLaunchTimeRef.current) / 1000
                  : 0;
              const currentStep = Math.floor(elapsedSec / 5);
              const targetMinSpeed = Math.min(0.18, 0.12 + currentStep * 0.012);

              const curSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
              speed = Math.min(0.18, Math.max(targetMinSpeed, curSpeed));
            }

            ball.vx = speed * Math.sin(bounceAngle);
            ball.vy = speed * Math.cos(bounceAngle);
            ball.speed = speed;

            // Option A: Precision Curve Strike Spin Transfer
            if (FEATURES.ENABLE_CURVE_STRIKE) {
              const pVel = paddleVelocityRef.current;
              if (Math.abs(pVel) > 0.035) {
                const spinForce = Math.max(-1.0, Math.min(1.0, pVel * 6.5));
                ball.spin = spinForce;
                spawnParticles(
                  nx,
                  ny,
                  spinForce > 0 ? "#22D3EE" : "#F472B6",
                  14
                );
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                    () => {}
                  );
                } catch {
                  // Fallback
                }
                if (Math.abs(spinForce) > 0.45) {
                  addFloatingText(
                    "SPIN! 💫",
                    nx,
                    ny + 0.3,
                    spinForce > 0 ? "#22D3EE" : "#F472B6"
                  );
                }
              } else {
                ball.spin = 0;
              }
            }

            soundManager.playHitPaddle();
            spawnParticles(nx, ny, "#FFE600", 8);
          }

          // Bottom Out of Bounds / Shield Check
          if (ny - ball.radius <= ARENA_BOUNDS.bottom) {
            if (shieldActiveRef.current) {
              ny = ARENA_BOUNDS.bottom + ball.radius;
              ball.vy = Math.abs(ball.vy);
              delete activeEffectsRef.current["shield"];
              soundManager.playHitPaddle();
              spawnParticles(nx, ny, "#00FFFF", 20);
            } else {
              spawnParticles(nx, ny, "#FF0055", 12);
              return;
            }
          }

          // Brick Collisions
          const deadBrickIds = new Set<string>();

          for (let i = 0; i < bricksRef.current.length; i++) {
            const b = bricksRef.current[i];
            if (!b || !b.isAlive || deadBrickIds.has(b.id)) continue;

            const halfW = b.width / 2;
            const halfH = b.height / 2;

            const closestX = Math.max(b.x - halfW, Math.min(nx, b.x + halfW));
            const closestY = Math.max(b.y - halfH, Math.min(ny, b.y + halfH));

            const distanceX = nx - closestX;
            const distanceY = ny - closestY;
            const distanceSquared =
              distanceX * distanceX + distanceY * distanceY;

            if (distanceSquared <= ball.radius * ball.radius) {
              b.hp -= 1;
              const group = brickMeshMapRef.current.get(b.id);

              if (b.hp <= 0) {
                b.isAlive = false;
                deadBrickIds.add(b.id);

                if (group) {
                  scene.remove(group);
                  brickMeshMapRef.current.delete(b.id);
                }

                comboRef.current += 1;
                const earnedScore = b.points * comboRef.current;
                onScoreChange(scoreRef.current + earnedScore, comboRef.current);

                spawnBlastShockwave(b.x, b.y, b.color);
                spawnParticles(b.x, b.y, b.color, 20);
                addFloatingText(`+${earnedScore}`, b.x, b.y, b.color);
                addFlyingCoin(b.x, b.y);

                if (b.type === "explosive") {
                  soundManager.playExplosion();
                  triggerExplosionRadius(b.x, b.y, 2.4);
                  addFloatingText(`💥 BLAST!`, b.x, b.y + 0.5, "#FF0055");
                } else {
                  soundManager.playExplosion();
                }

                if (b.powerUp) {
                  powerUpsRef.current.push({
                    id: `pup_${Math.random()}`,
                    type: b.powerUp,
                    x: b.x,
                    y: b.y,
                    z: b.z,
                    vy: -0.06,
                    color: getPowerUpColor(b.powerUp),
                  });
                }
              } else {
                soundManager.playHitBrick(520);
                spawnParticles(b.x, b.y, "#FFFFFF", 8);
                if (group) {
                  const mainMesh = group.children[0] as THREE.Mesh;
                  if (mainMesh) {
                    const mat = mainMesh.material as THREE.MeshStandardMaterial;
                    mat.emissive.setHex(0xffffff);
                    mat.emissiveIntensity = 0.95;
                    group.scale.set(0.9, 0.9, 0.9);
                    setTimeout(() => {
                      if (group) {
                        group.scale.set(1.0, 1.0, 1.0);
                        mat.emissive.setHex(0xffaa00);
                        mat.emissiveIntensity = 0.5;
                      }
                    }, 120);
                  }
                }
              }

              // Ball bounce speed calculation (0.20 for final 10 bricks, else 0.12 -> 0.18)
              const isEndgame =
                bricksRef.current.length <= 20 && bricksRef.current.length > 0;

              const currentSpeed = Math.sqrt(
                ball.vx * ball.vx + ball.vy * ball.vy
              );
              let newSpeed: number;
              if (isEndgame) {
                newSpeed = 0.25;
              } else {
                const elapsedSec =
                  lastLaunchTimeRef.current > 0
                    ? (Date.now() - lastLaunchTimeRef.current) / 1000
                    : 0;
                const currentStep = Math.floor(elapsedSec / 5);
                const targetMinSpeed = Math.min(0.18, 0.12 + currentStep * 0.012);
                newSpeed = Math.min(
                  0.18,
                  Math.max(targetMinSpeed, currentSpeed + 0.004)
                );
              }
              const speedRatio = newSpeed / (currentSpeed || 1);
              ball.speed = newSpeed;

              const overlapX = halfW + ball.radius - Math.abs(nx - b.x);
              const overlapY = halfH + ball.radius - Math.abs(ny - b.y);

              if (overlapX < overlapY) {
                ball.vx = -ball.vx * speedRatio;
                ball.vy = ball.vy * speedRatio;
              } else {
                ball.vx = ball.vx * speedRatio;
                ball.vy = -ball.vy * speedRatio;
              }

              break;
            }
          }

          if (deadBrickIds.size > 0) {
            bricksRef.current = bricksRef.current.filter(
              (bk) => !deadBrickIds.has(bk.id)
            );

            // Instant speed adjustment if entering the final 10 bricks threshold
            if (bricksRef.current.length <= 10 && bricksRef.current.length > 0) {
              ballsRef.current.forEach((b) => {
                const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                if (spd > 0 && Math.abs(spd - 0.20) > 0.001) {
                  const ratio = 0.20 / spd;
                  b.vx *= ratio;
                  b.vy *= ratio;
                  b.speed = 0.20;
                }
              });
            }
          }

          ball.x = nx;
          ball.y = ny;
          activeBalls.push(ball);
        });

        ballsRef.current = activeBalls;

        // Delayed Respawn sequence (1.0s delay with "BALL LOST!" popup)
        if (
          isBallInitializedRef.current &&
          !isRespawningRef.current &&
          ballsRef.current.length === 0
        ) {
          isRespawningRef.current = true;
          comboRef.current = 0;
          const newLives = livesRef.current - 1;
          onLifeChange(newLives);
          addFloatingText(`⚠️ BALL LOST!`, 0, -3.8, "#FF0055");

          if (newLives <= 0) {
            soundManager.playGameOver();
            onGameOver();
          } else {
            setRespawnText("GET READY...");
            if (respawnTimeoutRef.current) {
              clearTimeout(respawnTimeoutRef.current);
            }
            respawnTimeoutRef.current = setTimeout(() => {
              respawnTimeoutRef.current = null;
              if (isMountedRef.current) {
                resetBallAndPaddle();
              }
            }, 1000);
          }
        }

        // CRITICAL FIX: Victory condition requires bricksRef to have actually been loaded AND now fully cleared!
        if (
          isBallInitializedRef.current &&
          !hasTriggeredVictoryRef.current &&
          level.bricks.length > 0 &&
          bricksRef.current.length === 0
        ) {
          hasTriggeredVictoryRef.current = true; // Prevents repeated victory modal triggers!
          // Clear any dropped perks immediately so they do not leak into next level
          powerUpsRef.current = [];
          powerUpMeshMap.forEach((group) => {
            scene.remove(group);
          });
          powerUpMeshMap.clear();
          activeEffectsRef.current = {};
          setFloatingTexts([]);
          soundManager.playVictory();
          onVictory();
        }

        const activeFlyingCoins: FlyingCoinMesh[] = [];
        flyingCoinsRef.current.forEach((fc) => {
          fc.progress += 0.035;
          fc.group.position.x =
            fc.startX + (fc.targetX - fc.startX) * fc.progress;
          fc.group.position.y =
            fc.startY + (fc.targetY - fc.startY) * fc.progress;
          fc.group.rotation.y += 0.25;

          if (fc.progress < 1.0) {
            activeFlyingCoins.push(fc);
          } else {
            scene.remove(fc.group);
          }
        });
        flyingCoinsRef.current = activeFlyingCoins;

        updateBallMeshes();
        updatePowerUpMeshes();
        updateParticles();
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  };

  const activatePowerUp = (type: PowerUpType) => {
    onActivePowerUp(type);

    if (type === "wide_paddle") {
      activeEffectsRef.current["wide_paddle"] = Date.now() + 10000;
      paddleRef.current.width = 2.9;
      setTimeout(() => {
        paddleRef.current.width = 2.0;
        delete activeEffectsRef.current["wide_paddle"];
      }, 10000);
    } else if (type === "multi_ball") {
      // Cap active multi-balls on screen to max 3 total balls
      if (ballsRef.current.length > 0 && ballsRef.current.length < 3) {
        const mainBall = ballsRef.current[0];
        const isEndgame =
          bricksRef.current.length <= 10 && bricksRef.current.length > 0;
        const ballSpeed = isEndgame ? 0.20 : mainBall.speed;
        const curSpd =
          Math.sqrt(mainBall.vx * mainBall.vx + mainBall.vy * mainBall.vy) || 0.12;
        const speedScale = ballSpeed / curSpd;
        const baseVx =
          (Math.abs(mainBall.vx) > 0.02 ? mainBall.vx : 0.08) * speedScale;
        const baseVy =
          (Math.abs(mainBall.vy) > 0.02 ? mainBall.vy : 0.10) * speedScale;

        ballsRef.current.push({
          id: `ball_m1_${Math.random()}`,
          x: mainBall.x,
          y: mainBall.y,
          z: mainBall.z,
          vx: -baseVx,
          vy: Math.abs(baseVy),
          vz: 0,
          radius: 0.17,
          speed: ballSpeed,
        });

        if (ballsRef.current.length < 3) {
          ballsRef.current.push({
            id: `ball_m2_${Math.random()}`,
            x: mainBall.x,
            y: mainBall.y,
            z: mainBall.z,
            vx: baseVx * 0.7,
            vy: -Math.abs(baseVy) * 0.8,
            vz: 0,
            radius: 0.17,
            speed: ballSpeed,
          });
        }
      }
    } else if (type === "shield") {
      activeEffectsRef.current["shield"] = Date.now() + 15000;
    }
    // else if (type === 'slow_motion') {
    //   activeEffectsRef.current['slow_motion'] = Date.now() + 10000;
    //   ballsRef.current.forEach((b) => {
    //     b.vx *= 0.6;
    //     b.vy *= 0.6;
    //   });
    // }
  };

  const getPowerUpColor = (type: PowerUpType): string => {
    switch (type) {
      case "wide_paddle":
        return "#22D3EE";
      case "multi_ball":
        return "#FACC15";
      case "shield":
        return "#34D399";
      default:
        return "#38BDF8";
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingTexts((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((ft) => ({
            ...ft,
            y: ft.y - 1.5,
            alpha: ft.alpha - 0.04,
            scale: ft.scale + 0.02,
          }))
          .filter((ft) => ft.alpha > 0);
      });
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const activeWallpaper = wallpaper || getWallpaperByIndex(0);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Background Wallpaper Image */}
      <Image
        source={activeWallpaper.source}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Subtle Dark Vignette Tint: guarantees maximum contrast so ball and bricks remain 100% visible */}
      <View style={styles.contrastOverlay} pointerEvents="none" />

      <GLView style={styles.glView} onContextCreate={onContextCreate} />

      {/* Respawn Countdown Indicator */}
      {respawnText && (
        <View style={styles.respawnBanner} pointerEvents="none">
          <Text style={styles.respawnText}>{respawnText}</Text>
        </View>
      )}

      {/* Floating Text Score Popups */}
      {floatingTexts.map((ft) => (
        <Text
          key={ft.id}
          pointerEvents="none"
          style={[
            styles.floatingText,
            {
              left: ft.x - 30,
              top: ft.y,
              color: ft.color,
              opacity: ft.alpha,
              transform: [{ scale: ft.scale }],
            },
          ]}
        >
          {ft.text}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.base,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  contrastOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11, 16, 32, 0.45)",
  },
  glView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  floatingText: {
    position: "absolute",
    fontSize: 15,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 6,
    letterSpacing: 0.5,
  },
  flyingCoin: {
    position: "absolute",
    fontSize: 20,
  },
  respawnBanner: {
    position: "absolute",
    alignSelf: "center",
    top: "48%",
    backgroundColor: "rgba(11, 16, 32, 0.92)",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  respawnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
