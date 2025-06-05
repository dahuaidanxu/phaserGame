import Phaser from 'phaser';
import type { ItemConfig, ItemType } from './itemTypes';

export class Item extends Phaser.Physics.Arcade.Sprite {
  type: ItemType;

  constructor(scene: Phaser.Scene, x: number, y: number, config: ItemConfig) {
    super(scene, x, y, 'item');
    this.type = config.type;
    if (config.tint) this.setTint(config.tint);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(true);
    this.setVisible(true);
  }

  // 物品的收集、效果等方法可在此扩展
} 