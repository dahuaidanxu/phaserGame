export type ZombieType = 'normal' | 'fast' | 'elite' | 'boss';

export interface ZombieConfig {
  type: ZombieType;
  hp: number;
  speed: number;
  scale?: number;
  tint?: number;
  canBePenetrated?: boolean;
  texture?: string;
  displayWidth?: number;
  displayHeight?: number;
} 