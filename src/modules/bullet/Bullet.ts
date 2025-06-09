import Phaser from 'phaser';
import type { BulletConfig, BulletType } from './bulletTypes';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  type: BulletType;
  speed: number;
  damage: number;
  penetration: number;
  maxPenetration: number;
  hitZombies: Set<Phaser.Physics.Arcade.Sprite>;

  constructor(scene: Phaser.Scene, x: number, y: number, config: BulletConfig) {
    super(scene, x, y, 'bullet');
    this.type = config.type;
    this.speed = config.speed;
    this.damage = config.damage;
    this.penetration = 0;
    this.maxPenetration = config.penetration || 0;
    this.hitZombies = new Set();
    if (config.tint) this.setTint(config.tint);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(true);
    this.setVisible(true);
    
    // 设置子弹的显示大小
    this.setDisplaySize(16, 16);
    
    // 设置子弹的物理属性
    this.setCircle(8); // 增加碰撞半径为8像素
    this.setBounce(0);
    this.setCollideWorldBounds(false);
  }

  // 检查子弹是否可以穿透目标
  canPenetrate(zombie: Phaser.Physics.Arcade.Sprite): boolean {
    return this.penetration < this.maxPenetration && !this.hitZombies.has(zombie);
  }

  // 记录已击中的僵尸
  addHitZombie(zombie: Phaser.Physics.Arcade.Sprite): void {
    this.hitZombies.add(zombie);
    this.penetration++;
  }

  // 重置子弹状态
  reset(): void {
    this.penetration = 0;
    this.hitZombies.clear();
    this.setActive(false);
    this.setVisible(false);
  }

  // 发射、碰撞等方法可在此扩展
} 