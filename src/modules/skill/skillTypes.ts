export type SkillType = 'doubleDamage' | 'rapidFire' | 'shieldRegen' | 'coinMagnet' | 'ultimate';

export interface SkillConfig {
  type: SkillType;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
} 