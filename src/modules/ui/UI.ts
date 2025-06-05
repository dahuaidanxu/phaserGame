import Phaser from 'phaser';
import type { UIConfig, UIType } from './uiTypes';

export class UI extends Phaser.GameObjects.Text {
  type: UIType;

  constructor(scene: Phaser.Scene, config: UIConfig) {
    super(scene, config.x, config.y, config.text, config.style || {});
    this.type = config.type;
    scene.add.existing(this);
  }

  // UI的更新、交互等方法可在此扩展
} 