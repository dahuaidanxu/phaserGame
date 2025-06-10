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
    this.setCircle(12); // 增加碰撞半径为12像素，使其更接近显示大小
    this.setBounce(0);
    this.setCollideWorldBounds(false);
    this.setImmovable(true);
    if (this.body instanceof Phaser.Physics.Arcade.Body) {
        this.body.gravity.x = 0;
        this.body.gravity.y = 0;
    }
  }

  // 检查子弹是否可以穿透目标
  canPenetrate(zombie: Phaser.Physics.Arcade.Sprite): boolean {
    console.log('检查穿透：', {
      penetration: this.penetration,
      maxPenetration: this.maxPenetration,
      hasHit: this.hitZombies.has(zombie)
    });
    // 如果子弹还没有达到最大穿透次数，并且没有击中过这个僵尸，就可以穿透
    return this.penetration < this.maxPenetration && !this.hitZombies.has(zombie);
  }

  // 记录已击中的僵尸
  addHitZombie(zombie: Phaser.Physics.Arcade.Sprite): void {
    console.log('记录击中：', {
      beforePenetration: this.penetration,
      beforeHitCount: this.hitZombies.size
    });
    this.hitZombies.add(zombie);
    this.penetration++;
    console.log('记录击中后：', {
      afterPenetration: this.penetration,
      afterHitCount: this.hitZombies.size
    });
  }

  // 重置子弹状态
  reset(): void {
    this.penetration = 0;
    this.hitZombies.clear();
    this.setActive(false);
    this.setVisible(false);
  }

  // 检查是否应该销毁子弹
  shouldDestroy(): boolean {
    return this.penetration >= this.maxPenetration;
  }

  // 发射、碰撞等方法可在此扩展
} 