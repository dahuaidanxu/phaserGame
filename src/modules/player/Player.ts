import Phaser from 'phaser';
import type { PlayerConfig } from './playerTypes';

export class Player extends Phaser.Physics.Arcade.Sprite {
  health: number;
  shield: number;
  weaponType: string;
  weaponLevel: number;
  maxAmmo: number = 35;
  currentAmmo: number = 35;
  isReloading: boolean = false;
  ammoText: Phaser.GameObjects.Text;

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

    // 创建弹药显示文本
    this.ammoText = scene.add.text(x, y + 30, `${this.currentAmmo}/${this.maxAmmo}`, {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
  }

  update(): void {
    // 更新弹药显示位置
    this.ammoText.setPosition(this.x, this.y + 30);
  }

  canFire(): boolean {
    return this.currentAmmo > 0 && !this.isReloading;
  }

  fire(): void {
    if (this.canFire()) {
      this.currentAmmo--;
      this.updateAmmoText();
      
      // 当弹药耗尽时自动换弹
      if (this.currentAmmo <= 0) {
        this.reload();
      }
    }
  }

  reload(): void {
    if (this.isReloading || this.currentAmmo === this.maxAmmo) return;

    this.isReloading = true;
    this.ammoText.setText('换弹中...');

    // 播放换弹动画
    this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 1000,
      onComplete: () => {
        this.currentAmmo = this.maxAmmo;
        this.isReloading = false;
        this.updateAmmoText();
        this.setAngle(0);
      }
    });
  }

  updateAmmoText(): void {
    this.ammoText.setText(`${this.currentAmmo}/${this.maxAmmo}`);
  }

  destroy(): void {
    this.ammoText.destroy();
    super.destroy();
  }

  // 受伤、升级等方法可在此扩展
} 