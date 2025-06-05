import Phaser from 'phaser';
import type { BulletConfig, BulletType } from './bulletTypes';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  type: BulletType;
  speed: number;
  damage: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: BulletConfig) {
    super(scene, x, y, 'bullet');
    this.type = config.type;
    this.speed = config.speed;
    this.damage = config.damage;
    if (config.tint) this.setTint(config.tint);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(true);
    this.setVisible(true);
  }

  // 发射、碰撞等方法可在此扩展
} 