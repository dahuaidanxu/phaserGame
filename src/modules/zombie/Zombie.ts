import Phaser from 'phaser';
import type { ZombieConfig, ZombieType } from './zombieTypes';

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  type: ZombieType;
  hp: number;
  speed: number;
  originalTint: number;
  isInvulnerable: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: ZombieConfig) {
    super(scene, x, y, 'zombie');
    this.type = config.type;
    this.hp = config.hp;
    this.speed = config.speed;
    this.originalTint = config.tint || 0xffffff;
    
    if (config.scale) this.setScale(config.scale);
    if (config.tint) this.setTint(config.tint);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(true);
    this.setVisible(true);
    
    // 设置碰撞属性
    this.setCircle(16); // 设置碰撞半径为16像素
    this.setBounce(0);
    this.setCollideWorldBounds(false);
  }

  takeDamage(damage: number): void {
    if (this.isInvulnerable) return;
    
    this.hp -= damage;
    
    // 受伤闪烁效果
    this.isInvulnerable = true;
    this.setTint(0xff0000);
    
    // 受伤震动效果
    this.scene.tweens.add({
      targets: this,
      x: this.x + Phaser.Math.Between(-5, 5),
      y: this.y + Phaser.Math.Between(-5, 5),
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.setTint(this.originalTint);
        this.isInvulnerable = false;
      }
    });
  }

  die(): void {
    // 死亡动画
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 200,
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
      }
    });
  }

  update(): void {
    // 可以在这里添加僵尸的AI行为
    if (this.active) {
      // 确保僵尸始终面向玩家
      const player = this.scene.children.getByName('player') as Phaser.Physics.Arcade.Sprite;
      if (player) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.setRotation(angle);
      }
    }
  }
} 