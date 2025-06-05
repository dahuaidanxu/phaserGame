import Phaser from 'phaser';
import type { PlayerConfig } from './playerTypes';

export class Player extends Phaser.Physics.Arcade.Sprite {
  health: number;
  shield: number;
  weaponType: string;
  weaponLevel: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlayerConfig) {
    super(scene, x, y, 'player');
    this.health = config.health;
    this.shield = config.shield;
    this.weaponType = config.weaponType;
    this.weaponLevel = config.weaponLevel;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setVisible(true);
  }

  // 受伤、升级等方法可在此扩展
} 