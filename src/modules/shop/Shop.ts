import Phaser from 'phaser';
import type { ShopConfig, ShopItem } from './shopTypes';

export class Shop extends Phaser.GameObjects.Container {
  items: ShopItem[];

  constructor(scene: Phaser.Scene, x: number, y: number, config: ShopConfig) {
    super(scene, x, y);
    this.items = config.items;
    this.createShopUI();
    scene.add.existing(this);
  }

  private createShopUI(): void {
    const bg = this.scene.add.rectangle(0, 0, 500, 400, 0x000000, 0.9);
    const title = this.scene.add.text(0, -150, '商店', {
      fontSize: '48px',
      color: '#fff'
    }).setOrigin(0.5);

    const buttons = this.items.map((item, index) => {
      const button = this.scene.add.text(0, -50 + index * 60, 
        `${item.name} - ${item.cost}金币`, {
        fontSize: '32px',
        color: '#fff'
      }).setOrigin(0.5).setInteractive();
      
      button.on('pointerdown', () => this.purchaseItem(item));
      return button;
    });

    const closeButton = this.scene.add.text(0, 150, '关闭', {
      fontSize: '32px',
      color: '#fff'
    }).setOrigin(0.5).setInteractive();
    closeButton.on('pointerdown', () => this.setVisible(false));

    this.add([bg, title, ...buttons, closeButton]);
    this.setVisible(false);
  }

  private purchaseItem(item: ShopItem): void {
    // 购买物品的逻辑可在此扩展
  }
} 