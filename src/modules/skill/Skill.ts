import type { SkillConfig, SkillType } from './skillTypes';

export class Skill {
  public type: SkillType;
  public unlocked: boolean;
  public cost: number;
  private onUnlock: (type: SkillType) => void;

  constructor(config: SkillConfig, onUnlock: (type: SkillType) => void) {
    this.type = config.type;
    this.unlocked = config.unlocked;
    this.cost = config.cost;
    this.onUnlock = onUnlock;
  }

  unlock(): void {
    if (!this.unlocked) {
      this.unlocked = true;
      this.onUnlock(this.type);
    }
  }

  applyEffect(scene: Phaser.Scene): void {
    switch (this.type) {
      case 'rapidFire':
        // 实现快速射击效果
        break;
      case 'shieldRegen':
        // 实现护盾恢复效果
        break;
      // 其他技能效果可在此扩展
    }
  }
} 