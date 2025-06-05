import Phaser from 'phaser';
import type { ZombieConfig, ZombieType } from './zombieTypes';

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  type: ZombieType;
  hp: number;
  speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: ZombieConfig) {
    super(scene, x, y, 'zombie');
    this.type = config.type;
    this.hp = config.hp;
    this.speed = config.speed;
    if (config.scale) this.setScale(config.scale);
    if (config.tint) this.setTint(config.tint);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(true);
    this.setVisible(true);
  }

  // 受伤、死亡等方法可在此扩展
} 