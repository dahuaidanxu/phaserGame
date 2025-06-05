export type AchievementType = 'firstKill' | 'wave5' | 'wave10' | 'score1000' | 'score5000' | 'allSkills' | 'bossKill';

export interface AchievementConfig {
  type: AchievementType;
  name: string;
  description: string;
  unlocked: boolean;
} 