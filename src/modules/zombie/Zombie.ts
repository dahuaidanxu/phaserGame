import Phaser from 'phaser';
import type { ZombieConfig, ZombieType } from './zombieTypes';

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  type: ZombieType;
  hp: number;
  speed: number;
  originalTint: number;
  isInvulnerable: boolean = false;
  canBePenetrated: boolean; // 是否可被穿透

  constructor(scene: Phaser.Scene, x: number, y: number, config: ZombieConfig) {
    super(scene, x, y, 'zombie');
    this.type = config.type;
    this.hp = config.hp;
    this.speed = config.speed;
    this.originalTint = config.tint || 0xffffff;
    this.canBePenetrated = config.canBePenetrated ?? true; // 默认可以被穿透
    
    if (config.scale) this.setScale(config.scale);
    if (config.tint) this.setTint(config.tint);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(true);
    this.setVisible(true);
    
    // 设置碰撞属性
    this.setCircle(24); // 增加碰撞半径为24像素
    this.setBounce(0);
    this.setCollideWorldBounds(false);
    this.setImmovable(false); // 确保僵尸可以被推动
    if (this.body instanceof Phaser.Physics.Arcade.Body) {
        this.body.gravity.x = 0;
        this.body.gravity.y = 0;
    }
  }

  takeDamage(damage: number): void {
    if (this.isInvulnerable) return;
    
    this.hp -= damage;
    
    // 显示伤害数字
    const damageText = this.scene.add.text(this.x, this.y - 20, `-${damage}`, {
      fontSize: '20px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 显示当前生命值
    const hpText = this.scene.add.text(this.x, this.y - 40, `HP: ${this.hp}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 添加动画效果
    this.scene.tweens.add({
      targets: [damageText, hpText],
      y: this.y - 60,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        damageText.destroy();
        hpText.destroy();
      }
    });
    
    // 受伤闪烁效果
    this.isInvulnerable = true;
    this.setTint(0xff0000);
    
    // 闪烁后恢复原色
    this.scene.time.delayedCall(200, () => {
      this.setTint(this.originalTint);
      this.isInvulnerable = false;
    });
  }

  die(): void {
    // 立即消失
    this.setActive(false);
    this.setVisible(false);
    this.destroy(); // 完全销毁僵尸对象
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