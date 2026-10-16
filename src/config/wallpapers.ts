import { ImageSourcePropType } from "react-native";

export interface WallpaperItem {
  id: string;
  name: string;
  themeDescription: string;
  source: ImageSourcePropType;
}

/**
 * Safely resolves asset require calls across both React Native Metro bundler
 * and headless Node.js testing environments without breaking asset bundling.
 */
function safeRequireAsset(assetLoader: () => any): ImageSourcePropType {
  try {
    return assetLoader();
  } catch {
    // In Node.js testing environments without native asset bundler, return mock asset id
    return 1 as unknown as ImageSourcePropType;
  }
}

export const WALLPAPERS: WallpaperItem[] = [
  {
    id: "saturn_rings",
    name: "Saturn Rings",
    themeDescription: "Minimalist dark planetary silhouette with delicate rings",
    source: safeRequireAsset(() => require("../../assets/wallpapers/bg_saturn_rings.jpg")),
  },
  {
    id: "orbital_eclipse",
    name: "Orbital Eclipse",
    themeDescription: "Deep cosmic crescent with subtle geometric orbital paths",
    source: safeRequireAsset(() => require("../../assets/wallpapers/bg_orbital_eclipse.jpg")),
  },
  {
    id: "celestial_horizon",
    name: "Celestial Horizon",
    themeDescription: "Gentle curved planetary limb against obsidian space",
    source: safeRequireAsset(() => require("../../assets/wallpapers/bg_celestial_horizon.jpg")),
  },
  {
    id: "orbital_rings",
    name: "Orbital Rings",
    themeDescription: "Concentric circular orbital paths fading into graphite void",
    source: safeRequireAsset(() => require("../../assets/wallpapers/bg_orbital_rings.jpg")),
  },
  {
    id: "distant_cosmos",
    name: "Distant Cosmos",
    themeDescription: "Far shadowed celestial sphere with restrained starlight",
    source: safeRequireAsset(() => require("../../assets/wallpapers/bg_distant_cosmos.jpg")),
  },
];

/**
 * Selects a random wallpaper index, strictly avoiding consecutive duplicates
 * when multiple wallpapers are available.
 *
 * @param prevIndex - The index of the wallpaper from the previous level/session
 * @returns A randomly chosen index different from prevIndex
 */
export function getRandomWallpaperIndex(prevIndex?: number): number {
  if (WALLPAPERS.length <= 1) {
    return 0;
  }

  let nextIndex: number;
  do {
    nextIndex = Math.floor(Math.random() * WALLPAPERS.length);
  } while (prevIndex !== undefined && nextIndex === prevIndex && WALLPAPERS.length > 1);

  return nextIndex;
}

/**
 * Returns a WallpaperItem given an index, falling back safely to the first wallpaper.
 */
export function getWallpaperByIndex(index: number): WallpaperItem {
  if (index >= 0 && index < WALLPAPERS.length) {
    return WALLPAPERS[index];
  }
  return WALLPAPERS[0];
}
