import Phaser from 'phaser';
import type { ShopConfig, ShopItem, ShopState } from './shopTypes';

export class Shop extends Phaser.GameObjects.Container {
  public items: ShopItem[];
  private categories: ShopConfig['categories'];
  private shopState: ShopState;
  private currentCategory: string = 'weapon';
  private itemContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private confirmDialog?: Phaser.GameObjects.Container;
  private previewContainer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number, config: ShopConfig) {
    super(scene, x, y);
    this.items = config.items;
    this.categories = config.categories;
    this.shopState = {
      purchasedItems: new Set(),
      discounts: new Map(),
      unlockConditions: new Map()
    };
    this.createShopUI();
    scene.add.existing(this);
  }

  private createShopUI(): void {
    // 创建背景
    const bg = this.scene.add.rectangle(0, 0, 600, 500, 0x000000, 0.95);
    const title = this.scene.add.text(0, -200, '商店', {
      fontSize: '48px',
      color: '#fff'
    }).setOrigin(0.5);

    // 创建分类按钮
    const categoryButtons = Object.entries(this.categories).map(([key, name], index) => {
      const button = this.scene.add.text(-200 + index * 150, -150, name, {
        fontSize: '24px',
        color: '#fff',
        backgroundColor: key === this.currentCategory ? '#4a4a4a' : '#2a2a2a',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setInteractive();
      
      button.on('pointerdown', () => this.switchCategory(key));
      return button;
    });

    // 创建商品列表容器
    const itemsContainer = this.scene.add.container(0, 0);
    this.updateItemsList();

    // 创建关闭按钮
    const closeButton = this.scene.add.text(280, -200, '×', {
      fontSize: '32px',
      color: '#fff'
    }).setOrigin(0.5).setInteractive();
    closeButton.on('pointerdown', () => this.setVisible(false));

    // 添加所有元素到容器
    this.add([bg, title, ...categoryButtons, itemsContainer, closeButton]);

    // 设置容器位置为屏幕中心
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    this.setPosition(screenWidth / 2, screenHeight / 2);
    this.setVisible(false);
  }

  private switchCategory(category: string): void {
    this.currentCategory = category;
    this.updateItemsList();
  }

  private updateItemsList(): void {
    // 清除现有商品列表
    this.itemContainers.forEach(container => container.destroy());
    this.itemContainers.clear();

    // 获取当前分类的商品
    const categoryItems = this.items.filter(item => item.category === this.currentCategory);

    // 创建新的商品列表
    categoryItems.forEach((item, index) => {
      const container = this.createItemContainer(item, index);
      this.itemContainers.set(item.id, container);
    });
  }

  private createItemContainer(item: ShopItem, index: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, -50 + index * 100);
    
    // 商品背景
    const bg = this.scene.add.rectangle(0, 0, 500, 80, 0x2a2a2a);
    
    // 商品名称
    const name = this.scene.add.text(-200, 0, item.name, {
      fontSize: '24px',
      color: '#fff'
    }).setOrigin(0, 0.5);

    // 商品描述
    const description = this.scene.add.text(-200, 25, item.description, {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(0, 0.5);

    // 价格显示
    const finalCost = this.getFinalCost(item);
    const costText = this.scene.add.text(200, 0, `${finalCost}金币`, {
      fontSize: '24px',
      color: '#ffd700'
    }).setOrigin(1, 0.5);

    // 如果有折扣，显示折扣标签
    if (item.discount) {
      const discountText = this.scene.add.text(200, -20, `${Math.round(item.discount * 100)}% OFF`, {
        fontSize: '16px',
        color: '#ff4444'
      }).setOrigin(1, 0.5);
      container.add(discountText);
    }

    // 如果已购买，显示"已购买"标签
    if (this.shopState.purchasedItems.has(item.id)) {
      const purchasedText = this.scene.add.text(200, 20, '已购买', {
        fontSize: '16px',
        color: '#44ff44'
      }).setOrigin(1, 0.5);
      container.add(purchasedText);
    }

    // 添加交互
    bg.setInteractive();
    bg.on('pointerdown', () => this.showItemPreview(item));
    bg.on('pointerover', () => bg.setFillStyle(0x3a3a3a));
    bg.on('pointerout', () => bg.setFillStyle(0x2a2a2a));

    container.add([bg, name, description, costText]);
    this.add(container);
    return container;
  }

  private getFinalCost(item: ShopItem): number {
    const discount = item.discount || 0;
    return Math.floor(item.cost * (1 - discount));
  }

  private showItemPreview(item: ShopItem): void {
    if (this.previewContainer) {
      this.previewContainer.destroy();
    }

    this.previewContainer = this.scene.add.container(0, 150);
    
    // 预览背景
    const bg = this.scene.add.rectangle(0, 0, 400, 200, 0x1a1a1a);
    
    // 预览标题
    const title = this.scene.add.text(0, -80, '商品预览', {
      fontSize: '24px',
      color: '#fff'
    }).setOrigin(0.5);

    // 如果有预览图标，显示图标
    if (item.preview?.icon) {
      const icon = this.scene.add.image(-150, 0, item.preview.icon);
      icon.setScale(2);
      this.previewContainer.add(icon);
    }

    // 显示详细信息
    const details = this.scene.add.text(0, 0, 
      `名称: ${item.name}\n描述: ${item.description}\n价格: ${this.getFinalCost(item)}金币`, {
      fontSize: '18px',
      color: '#fff',
      align: 'center'
    }).setOrigin(0.5);

    // 购买按钮
    const buyButton = this.scene.add.text(0, 60, '购买', {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#4a4a4a',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    buyButton.on('pointerdown', () => this.showPurchaseConfirmation(item));

    this.previewContainer.add([bg, title, details, buyButton]);
    this.add(this.previewContainer);
  }

  private showPurchaseConfirmation(item: ShopItem): void {
    if (this.confirmDialog) {
      this.confirmDialog.destroy();
    }

    this.confirmDialog = this.scene.add.container(0, 0);
    
    // 确认对话框背景
    const bg = this.scene.add.rectangle(0, 0, 400, 200, 0x000000, 0.9);
    
    // 确认文本
    const text = this.scene.add.text(0, -40, 
      `确定要购买 ${item.name} 吗？\n价格: ${this.getFinalCost(item)}金币`, {
      fontSize: '24px',
      color: '#fff',
      align: 'center'
    }).setOrigin(0.5);

    // 确认按钮
    const confirmButton = this.scene.add.text(-80, 40, '确认', {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#4a4a4a',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    // 取消按钮
    const cancelButton = this.scene.add.text(80, 40, '取消', {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#4a4a4a',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    confirmButton.on('pointerdown', () => {
      this.purchaseItem(item);
      this.confirmDialog?.destroy();
      this.confirmDialog = undefined;
    });

    cancelButton.on('pointerdown', () => {
      this.confirmDialog?.destroy();
      this.confirmDialog = undefined;
    });

    this.confirmDialog.add([bg, text, confirmButton, cancelButton]);
    this.add(this.confirmDialog);
  }

  private purchaseItem(item: ShopItem): void {
    // 检查是否已购买
    if (this.shopState.purchasedItems.has(item.id)) {
      this.showMessage('该商品已购买');
      return;
    }

    // 检查解锁条件
    if (item.unlockCondition && !this.shopState.unlockConditions.get(item.id)) {
      this.showMessage('未满足购买条件');
      return;
    }

    // 检查金币是否足够
    const finalCost = this.getFinalCost(item);
    const coins = (this.scene as any).coins;
    if (coins < finalCost) {
      this.showMessage('金币不足');
      return;
    }

    // 扣除金币
    (this.scene as any).coins -= finalCost;
    (this.scene as any).coinsText.setText('金币: ' + (this.scene as any).coins);

    // 标记为已购买
    this.shopState.purchasedItems.add(item.id);

    // 更新商店界面
    this.updateItemsList();

    // 触发购买事件
    this.scene.events.emit('itemPurchased', item);

    this.showMessage('购买成功！');
  }

  private showMessage(text: string): void {
    const message = this.scene.add.text(0, 200, text, {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: message,
      alpha: 0,
      y: 150,
      duration: 2000,
      onComplete: () => message.destroy()
    });
  }

  public updateUnlockConditions(wave: number, score: number, killCount: number): void {
    this.items.forEach(item => {
      if (item.unlockCondition) {
        let isUnlocked = false;
        switch (item.unlockCondition.type) {
          case 'wave':
            isUnlocked = wave >= item.unlockCondition.value;
            break;
          case 'score':
            isUnlocked = score >= item.unlockCondition.value;
            break;
          case 'killCount':
            isUnlocked = killCount >= item.unlockCondition.value;
            break;
        }
        this.shopState.unlockConditions.set(item.id, isUnlocked);
      }
    });
    this.updateItemsList();
  }

  public applyDiscount(itemId: string, discount: number): void {
    this.shopState.discounts.set(itemId, discount);
    this.updateItemsList();
  }
} 