import type { AchievementConfig, AchievementType } from './achievementTypes';

export class Achievement {
  public type: AchievementType;
  public unlocked: boolean;
  private onUnlock: (type: AchievementType) => void;

  constructor(config: AchievementConfig, onUnlock: (type: AchievementType) => void) {
    this.type = config.type;
    this.unlocked = config.unlocked;
    this.onUnlock = onUnlock;
  }

  unlock(): void {
    if (!this.unlocked) {
      this.unlocked = true;
      this.onUnlock(this.type);
    }
  }
} 