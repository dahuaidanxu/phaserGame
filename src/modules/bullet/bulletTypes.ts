export type BulletType = 'normal' | 'spread' | 'laser';

export interface BulletConfig {
  type: BulletType;
  speed: number;
  damage: number;
  penetration?: number;
  tint?: number;
} 