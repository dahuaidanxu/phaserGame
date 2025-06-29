import 'phaser';
import { PLAYER_IMAGE, ZOMBIE_IMAGE, BULLET_IMAGE, BACKGROUND_IMAGE } from '../assets';
import { Player } from '../modules/player/Player';
import type { PlayerConfig } from '../modules/player/playerTypes';
import { Zombie } from '../modules/zombie/Zombie';
import type { ZombieConfig, ZombieType } from '../modules/zombie/zombieTypes';
import { Bullet } from '../modules/bullet/Bullet';
import type { BulletConfig, BulletType } from '../modules/bullet/bulletTypes';
import { Item } from '../modules/item/Item';
import type { ItemConfig, ItemType } from '../modules/item/itemTypes';
import { UI } from '../modules/ui/UI';
import type { UIConfig, UIType } from '../modules/ui/uiTypes';
import { Shop } from '../modules/shop/Shop';
import type { ShopConfig, ShopItem } from '../modules/shop/shopTypes';
import { Achievement } from '../modules/achievement/Achievement';
import type { AchievementConfig, AchievementType } from '../modules/achievement/achievementTypes';
import { Skill } from '../modules/skill/Skill';
import type { SkillConfig, SkillType } from '../modules/skill/skillTypes';

export class MainScene extends Phaser.Scene {
    private player!: Player;
    private zombies!: Phaser.Physics.Arcade.Group;
    private bullets!: Phaser.Physics.Arcade.Group;
    private items!: Phaser.Physics.Arcade.Group;
    private score: number = 0;
    private scoreText!: UI;
    private wave: number = 1;
    private waveText!: UI;
    private lastFired: number = 0;
    private fireRate: number = 1000;
    private zombieSpawnTimer!: Phaser.Time.TimerEvent;
    private zombieSpawnDelay: number = 2000;
    
    // 玩家属性
    private health: number = 3;
    private shield: number = 0;
    private healthText!: UI;
    private shieldText!: UI;
    private weaponType: string = 'normal';
    private weaponLevel: number = 1;
    private isPaused: boolean = false;
    private pauseButton!: Phaser.GameObjects.Text;
    private pauseMenu!: Phaser.GameObjects.Container;
    private coins: number = 0;
    private coinsText!: UI;
    private skillPoints: number = 0;
    private skillPointsText!: UI;
    private shopButton!: Phaser.GameObjects.Text;
    private shopMenu!: Shop;
    private isShopOpen: boolean = false;

    // 技能系统
    private skills: { [key: string]: Skill } = {};
    private ultimateCooldown: number = 0;
    private ultimateButton!: Phaser.GameObjects.Text;
    private ultimateCooldownText!: Phaser.GameObjects.Text;

    // 成就系统
    private achievements: { [key: string]: Achievement } = {};

    private gameContainer!: Phaser.GameObjects.Container;
    private maskGraphics!: Phaser.GameObjects.Graphics;

    private viewX: number = 0;
    private viewY: number = 0;
    private viewW: number = 0;
    private viewH: number = 0;

    private screenW: number = 0;
    private screenH: number = 0;

    private achievementTipText!: Phaser.GameObjects.Text;
    private skillTipText!: Phaser.GameObjects.Text;

    private lastClickX: number = 0;
    private lastClickY: number = 0;
    private hasClickTarget: boolean = false;
    private isDragging: boolean = false;
    private currentTargetZombie: Phaser.Physics.Arcade.Sprite | null = null;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload(): void {
        // 加载游戏资源
        this.load.image('player', PLAYER_IMAGE);
        this.load.image('zombie', ZOMBIE_IMAGE);
        this.load.image('zombie-normal', 'public/zombieImage/zombie-normal/normal-1.svg');
        this.load.image('bullet', BULLET_IMAGE);
        this.load.image('background', 'public/bgImage/main-bg-new.jpg');
    }

    create(): void {
        // 获取屏幕宽高
        this.screenW = this.sys.game.config.width as number;
        this.screenH = this.sys.game.config.height as number;
        this.viewW = this.screenW;
        this.viewH = this.screenH;
        this.viewX = 0;
        this.viewY = 0;

        // 背景图全屏
        const bg = this.add.image(this.screenW / 2, this.screenH / 2, 'background').setDisplaySize(this.screenW, this.screenH);
        // 背景虚化效果
        bg.setAlpha(0.8);

        // 创建内容容器
        this.gameContainer = this.add.container(0, 0);

        // 创建遮罩
        this.maskGraphics = this.make.graphics({ x: 0, y: 0 });
        this.maskGraphics.fillStyle(0xffffff);
        // 圆角矩形遮罩
        this.maskGraphics.fillRoundedRect(this.viewX, this.viewY, this.viewW, this.viewH, 20);
        // 边框效果
        this.maskGraphics.lineStyle(2, 0xffffff, 1);
        this.maskGraphics.strokeRoundedRect(this.viewX, this.viewY, this.viewW, this.viewH, 20);
        const mask = this.maskGraphics.createGeometryMask();
        this.gameContainer.setMask(mask);

        // 玩家
        const playerX = this.viewX + this.viewW / 2;
        const playerY = this.viewY + this.viewH - 50;
        const playerConfig: PlayerConfig = {
            health: 3,
            shield: 0,
            weaponType: 'normal',
            weaponLevel: 1
        };
        this.player = new Player(this, playerX, playerY, playerConfig);
        this.gameContainer.add(this.player);

        // 子弹组
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 100
        });
        // 僵尸组
        this.zombies = this.physics.add.group({
            defaultKey: 'zombie',
            maxSize: 300
        });
        // 道具组
        this.items = this.physics.add.group({
            defaultKey: 'item',
            maxSize: 50
        });
        // 把组里的内容加到容器（需监听生成时加进去）
        this.bullets.runChildUpdate = true;
        this.zombies.runChildUpdate = true;
        this.items.runChildUpdate = true;
        // 监听生成时自动加到容器
        this.bullets.on('add', (gameObject: any) => this.gameContainer.add(gameObject));
        this.zombies.on('add', (gameObject: any) => this.gameContainer.add(gameObject));
        this.items.on('add', (gameObject: any) => this.gameContainer.add(gameObject));

        // UI文本不加遮罩，直接add
        this.createUI();

        // 设置碰撞
        this.physics.add.collider(this.bullets, this.zombies, (bullet, zombie) => {
            console.log('碰撞检测触发');
            this.hitZombie(bullet as Bullet, zombie as Zombie);
        }, undefined, this);
        this.physics.add.collider(this.player, this.zombies, this.hitPlayer as any, undefined, this);
        this.physics.add.collider(this.player, this.items, this.collectItem as any, undefined, this);

        // 初始化时直接生成100只僵尸
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(this.viewX + 50, this.viewX + this.viewW - 50);
            const y = this.viewY + 50; // 固定在屏幕上方
            let type = Phaser.Math.Between(1, 3);
            let zombieConfig: ZombieConfig;
            
            switch (type) {
                case 1:
                    zombieConfig = { 
                        type: 'normal', 
                        hp: 20, 
                        speed: 8 + this.wave * 0.4,
                        scale: 1,
                        canBePenetrated: true,
                        texture: 'zombie-normal',
                        displayWidth: 70,
                        displayHeight: 100
                    };
                    break;
                case 2:
                    zombieConfig = { 
                        type: 'fast', 
                        hp: 10, 
                        speed: 16 + this.wave * 0.8,
                        scale: 1, 
                        tint: 0xff0000,
                        canBePenetrated: true 
                    };
                    break;
                case 3:
                    zombieConfig = { 
                        type: 'elite', 
                        hp: 40, 
                        speed: 6 + this.wave * 0.3,
                        scale: 1.5, 
                        tint: 0x0000ff,
                        canBePenetrated: false
                    };
                    break;
                default:
                    zombieConfig = { 
                        type: 'normal', 
                        hp: 20, 
                        speed: 8, 
                        scale: 1,
                        canBePenetrated: true,
                        texture: 'zombie-normal',
                        displayWidth: 70,
                        displayHeight: 100
                    };
            }
            const zombie = new Zombie(this, x, y, zombieConfig);
            this.zombies.add(zombie);
        }

        // 定时生成僵尸
        this.zombieSpawnTimer = this.time.addEvent({
            delay: this.zombieSpawnDelay,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });

        // 定时进入下一波
        this.time.addEvent({
            delay: 15000,
            callback: this.nextWave,
            callbackScope: this,
            loop: true
        });

        // 护盾自动恢复
        this.time.addEvent({
            delay: 10000,
            callback: this.regenerateShield,
            callbackScope: this,
            loop: true
        });

        // 终极技能冷却
        this.time.addEvent({
            delay: 1000,
            callback: this.updateUltimateCooldown,
            callbackScope: this,
            loop: true
        });

        // 成就提示文本（只创建一次，默认隐藏）
        this.achievementTipText = this.add.text(this.screenW / 2, this.viewY + 40, '', {
            fontSize: '28px',
            color: '#ffe082',
            fontStyle: 'bold',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { left: 20, right: 20, top: 10, bottom: 10 },
        }).setOrigin(0.5).setAlpha(0).setDepth(100);

        // 成就创建时使用Achievement类，传入回调
        const achievementConfigs: AchievementConfig[] = [
            { type: 'firstKill', name: '首次击杀', description: '击杀第一个僵尸', unlocked: false },
            { type: 'wave5', name: '第五波', description: '完成第5波', unlocked: false },
            { type: 'wave10', name: '第十波', description: '完成第10波', unlocked: false },
            { type: 'score1000', name: '1000分', description: '获得1000分', unlocked: false },
            { type: 'score5000', name: '5000分', description: '获得5000分', unlocked: false },
            { type: 'allSkills', name: '全技能', description: '解锁所有技能', unlocked: false },
            { type: 'bossKill', name: 'Boss击杀', description: '击杀Boss', unlocked: false }
        ];
        this.achievements = {};
        achievementConfigs.forEach(config => {
            this.achievements[config.type] = new Achievement(config, (type) => this.showAchievementTip(config.name + ' 已解锁！'));
        });

        // 技能提示文本（只创建一次，默认隐藏）
        this.skillTipText = this.add.text(this.screenW / 2, this.viewY + 40, '', {
            fontSize: '28px',
            color: '#ffe082',
            fontStyle: 'bold',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { left: 20, right: 20, top: 10, bottom: 10 },
        }).setOrigin(0.5).setAlpha(0).setDepth(100);

        // 技能创建时使用Skill类，传入回调
        const skillConfigs: SkillConfig[] = [
            { type: 'doubleDamage', name: '双倍伤害', description: '伤害翻倍', cost: 100, unlocked: false },
            { type: 'rapidFire', name: '快速射击', description: '射击速度提升', cost: 150, unlocked: false },
            { type: 'shieldRegen', name: '护盾恢复', description: '自动恢复护盾', cost: 200, unlocked: false },
            { type: 'coinMagnet', name: '金币磁铁', description: '自动吸引金币', cost: 250, unlocked: false },
            { type: 'ultimate', name: '终极技能', description: '清除所有僵尸', cost: 500, unlocked: false }
        ];
        this.skills = {};
        skillConfigs.forEach(config => {
            this.skills[config.type] = new Skill(config, (type: SkillType) => this.showSkillTip(config.name + ' 已解锁！'));
        });

        // 创建商店菜单
        const shopConfig: ShopConfig = {
            items: [
                {
                    id: 'doubleDamage',
                    name: '双倍伤害',
                    description: '使所有攻击伤害翻倍',
                    cost: 100,
                    skill: 'doubleDamage',
                    category: 'weapon',
                    unlockCondition: { type: 'wave', value: 2 }
                },
                {
                    id: 'rapidFire',
                    name: '快速射击',
                    description: '提升50%射击速度',
                    cost: 150,
                    skill: 'rapidFire',
                    category: 'weapon',
                    unlockCondition: { type: 'wave', value: 3 }
                },
                {
                    id: 'shieldRegen',
                    name: '护盾恢复',
                    description: '每10秒自动恢复1点护盾',
                    cost: 200,
                    skill: 'shieldRegen',
                    category: 'defense',
                    unlockCondition: { type: 'wave', value: 4 }
                },
                {
                    id: 'coinMagnet',
                    name: '金币磁铁',
                    description: '自动吸引周围的金币',
                    cost: 250,
                    skill: 'coinMagnet',
                    category: 'utility',
                    unlockCondition: { type: 'score', value: 1000 }
                },
                {
                    id: 'ultimate',
                    name: '终极技能',
                    description: '清除所有僵尸（30秒冷却）',
                    cost: 500,
                    skill: 'ultimate',
                    category: 'ultimate',
                    unlockCondition: { type: 'wave', value: 5 }
                }
            ],
            categories: {
                weapon: '武器',
                defense: '防御',
                utility: '功能',
                ultimate: '终极'
            }
        };
        // 创建商店，位置由Shop类内部处理
        this.shopMenu = new Shop(this, 0, 0, shopConfig);

        // 监听商店购买事件
        this.events.on('itemPurchased', (item: ShopItem) => {
            if (this.skills[item.skill]) {
                this.skills[item.skill].unlock();
            }
        });

        // 每波更新商店解锁条件
        this.events.on('waveComplete', () => {
            this.shopMenu.updateUnlockConditions(this.wave, this.score, this.zombies.getChildren().length);
        });

        // 随机折扣系统
        this.time.addEvent({
            delay: 30000, // 每30秒
            callback: () => {
                const items = this.shopMenu.items;
                const randomItem = items[Phaser.Math.Between(0, items.length - 1)];
                const discount = Phaser.Math.FloatBetween(0.1, 0.3); // 10%-30%的折扣
                this.shopMenu.applyDiscount(randomItem.id, discount);
            },
            loop: true
        });

        // 添加点击和拖动事件监听
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.lastClickX = pointer.x;
            this.lastClickY = pointer.y;
            this.hasClickTarget = true;
            this.isDragging = true;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging) {
                this.lastClickX = pointer.x;
                this.lastClickY = pointer.y;
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        this.input.on('pointerout', () => {
            this.isDragging = false;
        });
    }

    update(): void {
        if (this.isPaused) return;

        // 更新玩家
        this.player.update();

        // 自动发射子弹
        if (this.time.now > this.lastFired) {
            this.fire();
            this.lastFired = this.time.now + this.fireRate;
        }

        // 更新僵尸
        this.zombies.getChildren().forEach((zombie) => {
            if (zombie.active) {
                const sprite = zombie as Phaser.Physics.Arcade.Sprite;
                const zombieInstance = zombie as Zombie;
                // 使用僵尸实例中存储的速度值
                this.physics.moveToObject(sprite, this.player, zombieInstance.speed);
            }
        });

        // 更新子弹
        this.bullets.getChildren().forEach((bullet) => {
            if (bullet.active) {
                const sprite = bullet as Phaser.Physics.Arcade.Sprite;
                // 检查子弹是否超出屏幕边界
                if (sprite.x < -50 || sprite.x > this.screenW + 50 || 
                    sprite.y < -50 || sprite.y > this.screenH + 50) {
                    console.log('子弹超出边界，立即消失');
                    sprite.setActive(false);
                    sprite.setVisible(false);
                    sprite.destroy(); // 完全销毁子弹
                }
            }
        });

        // 更新UI
        this.scoreText.update();
        this.waveText.update();
        this.healthText.update();
        this.shieldText.update();
        this.coinsText.update();
        this.skillPointsText.update();
    }

    private createUI(): void {
        // 左上角：分数、波次
        const scoreConfig: UIConfig = { type: 'score', text: '分数: 0', x: this.viewX + 24, y: this.viewY + 24, style: { fontSize: '28px', color: '#fff', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.4)', padding: { left: 12, right: 12, top: 6, bottom: 6 } } };
        this.scoreText = new UI(this, scoreConfig);
        const waveConfig: UIConfig = { type: 'wave', text: '波次: 1', x: this.viewX + 24, y: this.viewY + 64, style: { fontSize: '28px', color: '#fff', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.4)', padding: { left: 12, right: 12, top: 6, bottom: 6 } } };
        this.waveText = new UI(this, waveConfig);

        // 左下角：生命、护盾
        const healthConfig: UIConfig = { type: 'health', text: '生命: ❤️❤️❤️', x: this.viewX + 24, y: this.viewY + this.viewH - 80, style: { fontSize: '28px', color: '#fff', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.4)', padding: { left: 12, right: 12, top: 6, bottom: 6 } } };
        this.healthText = new UI(this, healthConfig);
        const shieldConfig: UIConfig = { type: 'shield', text: '护盾: 0', x: this.viewX + 24, y: this.viewY + this.viewH - 40, style: { fontSize: '28px', color: '#fff', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.4)', padding: { left: 12, right: 12, top: 6, bottom: 6 } } };
        this.shieldText = new UI(this, shieldConfig);

        // 右下角：金币、技能点
        const coinsConfig: UIConfig = { type: 'coins', text: '金币: 0', x: this.viewX + this.viewW - 24, y: this.viewY + this.viewH - 80, style: { fontSize: '28px', color: '#fff', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.4)', padding: { left: 12, right: 12, top: 6, bottom: 6 } } };
        this.coinsText = new UI(this, coinsConfig);
        this.coinsText.setOrigin(1, 0);
        const skillPointsConfig: UIConfig = { type: 'skillPoints', text: '技能点: 0', x: this.viewX + this.viewW - 24, y: this.viewY + this.viewH - 40, style: { fontSize: '28px', color: '#fff', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.4)', padding: { left: 12, right: 12, top: 6, bottom: 6 } } };
        this.skillPointsText = new UI(this, skillPointsConfig);
        this.skillPointsText.setOrigin(1, 0);

        // 右上角：按钮区
        this.pauseButton = this.add.text(this.viewX + this.viewW - 24, this.viewY + 24, '⏸️', {
            fontSize: '28px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.4)', padding: { left: 10, right: 10, top: 6, bottom: 6 }
        }).setOrigin(1, 0).setInteractive();
        this.pauseButton.on('pointerdown', () => this.togglePause());
        this.shopButton = this.add.text(this.viewX + this.viewW - 24, this.viewY + 64, '🛒', {
            fontSize: '28px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.4)', padding: { left: 10, right: 10, top: 6, bottom: 6 }
        }).setOrigin(1, 0).setInteractive();
        this.shopButton.on('pointerdown', () => this.toggleShop());
        this.ultimateButton = this.add.text(this.viewX + this.viewW - 24, this.viewY + 104, '💥', {
            fontSize: '28px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.4)', padding: { left: 10, right: 10, top: 6, bottom: 6 }
        }).setOrigin(1, 0).setInteractive();
        this.ultimateButton.on('pointerdown', () => this.useUltimate());
        this.ultimateCooldownText = this.add.text(this.viewX + this.viewW - 24, this.viewY + 144, '', {
            fontSize: '20px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.4)', padding: { left: 8, right: 8, top: 4, bottom: 4 }
        }).setOrigin(1, 0);

        // 创建暂停菜单
        this.createPauseMenu();
    }

    private useUltimate(): void {
        if (this.skills.ultimate && this.ultimateCooldown <= 0) {
            this.ultimateCooldown = 30; // 30秒冷却
            
            // 清除所有僵尸
            this.zombies.getChildren().forEach((zombie) => {
                const sprite = zombie as Phaser.Physics.Arcade.Sprite;
                if (sprite.active) {
                    this.createExplosion(sprite.x, sprite.y);
                    sprite.setActive(false);
                    sprite.setVisible(false);
                    this.score += 10;
                }
            });
            
            // 更新分数显示
            this.scoreText.setText('分数: ' + this.score);
        }
    }

    private updateUltimateCooldown(): void {
        if (this.ultimateCooldown > 0) {
            this.ultimateCooldown--;
            this.ultimateCooldownText.setText(this.ultimateCooldown.toString());
        } else {
            this.ultimateCooldownText.setText('');
        }
    }

    private regenerateShield(): void {
        if (this.skills.shieldRegen && this.shield < 3) {
            this.shield++;
            this.updateShieldText();
        }
    }

    private createExplosion(x: number, y: number): void {
        const explosion = this.add.circle(x, y, 30, 0xffe082, 0.7).setDepth(1);
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2,
            duration: 400,
            onComplete: () => explosion.destroy()
        });
    }

    private nextWave(): void {
        this.wave++;
        this.waveText.setText('波次: ' + this.wave);
        
        // 重置僵尸生成延迟
        this.zombieSpawnDelay = 2000;
        
        // 更新僵尸生成定时器
        this.zombieSpawnTimer.remove(false);
        this.zombieSpawnTimer = this.time.addEvent({
            delay: this.zombieSpawnDelay,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });

        // 每波获得技能点
        this.skillPoints++;
        this.skillPointsText.setText('技能点: ' + this.skillPoints);

        // 检查波次成就
        if (this.wave >= 5 && !this.achievements.wave5.unlocked) {
            this.achievements.wave5.unlock();
        }
        if (this.wave >= 10 && !this.achievements.wave10.unlocked) {
            this.achievements.wave10.unlock();
        }
    }

    private toggleShop(): void {
        this.isShopOpen = !this.isShopOpen;
        this.shopMenu.setVisible(this.isShopOpen);
        if (this.isShopOpen) {
            this.physics.pause();
        } else {
            this.physics.resume();
        }
    }

    private fire(): void {
        // 找到最近的僵尸
        let targetZombie: Phaser.Physics.Arcade.Sprite | null = null;
        
        if (this.hasClickTarget) {
            // 如果有点击目标，找到点击位置到射击直线最近的僵尸
            targetZombie = this.findNearestZombieOnLine();
            // 更新当前目标
            this.currentTargetZombie = targetZombie;
        }
        
        if (!targetZombie) {
            // 如果没有找到目标，使用原来的逻辑找最近的僵尸
            let minDistance = Infinity;
            this.zombies.getChildren().forEach((zombie) => {
                const sprite = zombie as Phaser.Physics.Arcade.Sprite;
                if (sprite.active) {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
                    if (distance < minDistance) {
                        minDistance = distance;
                        targetZombie = sprite;
                    }
                }
            });
            // 更新当前目标
            this.currentTargetZombie = targetZombie;
        }

        if (!targetZombie) {
            return; // 如果没有僵尸，不发射子弹
        }

        // 计算基础角度
        let baseAngle: number;
        if (this.hasClickTarget) {
            // 使用点击位置计算角度
            baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.lastClickX, this.lastClickY);
        } else {
            // 使用目标僵尸位置计算角度
            baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetZombie.x, targetZombie.y);
        }

        const speed = 800;
        const spreadAngle = Math.PI / 36;

        // 创建4条弹道
        for (let i = 0; i < 4; i++) {
            // 计算当前弹道的角度
            const angle = baseAngle - spreadAngle + (spreadAngle * 2 * i / 3);
            
            // 每条弹道发射3颗子弹，依次排列
            for (let j = 0; j < 3; j++) {
                // 计算子弹的偏移位置（让子弹依次排列）
                const offsetDistance = j * 50;
                const offsetX = Math.cos(angle) * offsetDistance;
                const offsetY = Math.sin(angle) * offsetDistance;

                const velocityX = Math.cos(angle) * speed;
                const velocityY = Math.sin(angle) * speed;

                // 发射子弹
                const bulletConfig: BulletConfig = {
                    type: this.player.weaponType as BulletType,
                    speed: 800,
                    damage: this.skills.doubleDamage ? 4 : 2,
                    penetration: 1
                };
                const bullet = new Bullet(this, 
                    this.player.x - offsetX,
                    this.player.y - offsetY, 
                    bulletConfig
                );
                this.bullets.add(bullet);
                bullet.setVelocity(velocityX, velocityY);
                bullet.setRotation(angle);

                // 添加子弹特效
                this.createBulletTrail(bullet);
            }
        }

        // 更新玩家弹药（只扣除一颗子弹）
        this.player.fire();
    }

    private createBulletTrail(bullet: Bullet): void {
        const trail = this.add.graphics();
        const points: Phaser.Math.Vector2[] = [];
        const maxPoints = 5;
        
        const updateTrail = () => {
            if (!bullet.active) {
                trail.destroy();
                return;
            }
            
            points.push(new Phaser.Math.Vector2(bullet.x, bullet.y));
            if (points.length > maxPoints) {
                points.shift();
            }
            
            trail.clear();
            trail.lineStyle(2, 0xffff00, 0.5);
            trail.beginPath();
            points.forEach((point, index) => {
                if (index === 0) {
                    trail.moveTo(point.x, point.y);
                } else {
                    trail.lineTo(point.x, point.y);
                }
            });
            trail.strokePath();
        };
        
        this.time.addEvent({
            delay: 16,
            callback: updateTrail,
            callbackScope: this,
            loop: true
        });
    }

    private hitPlayer(player: any, zombie: any): void {
        if (this.shield > 0) {
            this.shield--;
            this.updateShieldText();
            zombie.setActive(false);
            zombie.setVisible(false);
        } else {
            this.player.health--;
            this.updateHealthText();
            zombie.setActive(false);
            zombie.setVisible(false);
            
            if (this.player.health <= 0) {
                this.gameOver();
            } else {
                // 受伤闪烁效果
                player.setTint(0xff0000);
                this.time.delayedCall(200, () => {
                    player.clearTint();
                });
            }
        }
    }

    private spawnItem(x: number, y: number): void {
        const itemType = Phaser.Math.Between(1, 3);
        let itemConfig: ItemConfig;
        switch (itemType) {
            case 1: // 生命
                itemConfig = { type: 'health', tint: 0xff0000 };
                break;
            case 2: // 护盾
                itemConfig = { type: 'shield', tint: 0x0000ff };
                break;
            case 3: // 武器升级
                itemConfig = { type: 'weapon', tint: 0x00ff00 };
                break;
            default:
                itemConfig = { type: 'health', tint: 0xff0000 };
        }
        const item = new Item(this, x, y, itemConfig);
        this.items.add(item);
    }

    private collectItem(player: any, item: any): void {
        const type = item.getData('type');
        switch (type) {
            case 'health':
                if (this.player.health < 3) {
                    this.player.health++;
                    this.updateHealthText();
                }
                break;
            case 'shield':
                this.shield++;
                this.updateShieldText();
                break;
            case 'weapon':
                this.upgradeWeapon();
                break;
        }
        item.setActive(false);
        item.setVisible(false);
    }

    private upgradeWeapon(): void {
        this.weaponLevel++;
        if (this.weaponLevel === 2) {
            this.weaponType = 'spread';
        } else if (this.weaponLevel === 3) {
            this.weaponType = 'laser';
        }
    }

    private updateHealthText(): void {
        this.healthText.setText('生命: ' + '❤️'.repeat(this.player.health));
    }

    private updateShieldText(): void {
        this.shieldText.setText('护盾: ' + '🛡️'.repeat(this.shield));
    }

    private createPauseMenu(): void {
        this.pauseMenu = this.add.container(this.screenW / 2, this.screenH / 2);
        const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.8);
        const title = this.add.text(0, -100, '游戏暂停', {
            fontSize: '48px',
            color: '#fff'
        }).setOrigin(0.5);
        const resumeButton = this.add.text(0, 0, '继续游戏', {
            fontSize: '32px',
            color: '#fff'
        }).setOrigin(0.5).setInteractive();
        const restartButton = this.add.text(0, 50, '重新开始', {
            fontSize: '32px',
            color: '#fff'
        }).setOrigin(0.5).setInteractive();

        resumeButton.on('pointerdown', () => this.togglePause());
        restartButton.on('pointerdown', () => this.scene.restart());

        this.pauseMenu.add([bg, title, resumeButton, restartButton]);
        this.pauseMenu.setVisible(false);
    }

    private togglePause(): void {
        this.isPaused = !this.isPaused;
        this.pauseMenu.setVisible(this.isPaused);
        if (this.isPaused) {
            this.physics.pause();
        } else {
            this.physics.resume();
        }
    }

    private gameOver(): void {
        this.physics.pause();
        this.add.text(400, 300, '游戏结束\n最终分数: ' + this.score + '\n波次: ' + this.wave, {
            fontSize: '48px',
            color: '#fff',
            align: 'center'
        }).setOrigin(0.5);
    }

    private spawnZombie(): void {
        // 检查当前僵尸数量
        const currentZombieCount = this.zombies.getChildren().filter(zombie => zombie.active).length;
        
        // 如果僵尸数量超过300，停止生成
        if (currentZombieCount >= 300) {
            return;
        }

        // 根据当前僵尸数量动态调整生成频率
        if (currentZombieCount < 100) {
            // 如果僵尸数量少于100，加快生成速度
            this.zombieSpawnDelay = Math.max(500, this.zombieSpawnDelay - 100);
        } else if (currentZombieCount > 200) {
            // 如果僵尸数量超过200，减慢生成速度
            this.zombieSpawnDelay = Math.min(2000, this.zombieSpawnDelay + 100);
        }

        // 随机生成位置（在屏幕上方）
        const x = Phaser.Math.Between(this.viewX + 50, this.viewX + this.viewW - 50);
        const y = this.viewY + 50;

        // 根据波数决定生成什么类型的僵尸
        let type = Phaser.Math.Between(1, 3);
        let zombieConfig: ZombieConfig;

        switch (type) {
            case 1:
                zombieConfig = { 
                    type: 'normal', 
                    hp: 20, 
                    speed: 8 + this.wave * 0.4,
                    scale: 1,
                    canBePenetrated: true,
                    texture: 'zombie-normal',
                    displayWidth: 70,
                    displayHeight: 100
                };
                break;
            case 2:
                zombieConfig = { 
                    type: 'fast', 
                    hp: 10, 
                    speed: 16 + this.wave * 0.8,
                    scale: 1, 
                    tint: 0xff0000,
                    canBePenetrated: true 
                };
                break;
            case 3:
                zombieConfig = { 
                    type: 'elite', 
                    hp: 40, 
                    speed: 6 + this.wave * 0.3,
                    scale: 1.5, 
                    tint: 0x0000ff,
                    canBePenetrated: false
                };
                break;
            default:
                zombieConfig = { 
                    type: 'normal', 
                    hp: 20, 
                    speed: 8, 
                    scale: 1,
                    canBePenetrated: true,
                    texture: 'zombie-normal',
                    displayWidth: 70,
                    displayHeight: 100
                };
        }

        const zombie = new Zombie(this, x, y, zombieConfig);
        this.zombies.add(zombie);

        // 更新僵尸生成定时器
        this.zombieSpawnTimer.remove(false);
        this.zombieSpawnTimer = this.time.addEvent({
            delay: this.zombieSpawnDelay,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });
    }

    private hitZombie(bullet: Bullet, zombie: Zombie): void {
        console.log('hitZombie方法被调用'); // 添加调试日志

        // 检查僵尸是否可以被穿透
        if (!zombie.canBePenetrated) {
            console.log('僵尸不可被穿透，子弹立即消失');
            // 计算伤害
            let damage = bullet.damage;
            if (this.skills.doubleDamage) {
                damage *= 2;
            }

            // 控制台输出伤害信息
            console.log('----------------------------------------');
            console.log(`僵尸类型: ${zombie.type}`);
            console.log(`当前生命值: ${zombie.hp}`);
            console.log(`受到伤害: ${damage}`);
            console.log(`剩余生命值: ${zombie.hp - damage}`);
            console.log(`子弹类型: ${bullet.type}`);
            console.log(`是否暴击: ${this.skills.doubleDamage ? '是' : '否'}`);
            console.log('----------------------------------------');

            // 应用伤害
            zombie.takeDamage(damage);
            
            if (zombie.hp <= 0) {
                console.log(`僵尸死亡! 类型: ${zombie.type}`);
                // 如果当前目标僵尸死亡，重置目标
                if (this.currentTargetZombie === zombie) {
                    this.currentTargetZombie = null;
                    this.hasClickTarget = false;
                }
                zombie.die();
                // 掉落金币
                if (zombie.type === 'boss') {
                    this.coins += 50;
                    this.achievements.bossKill.unlock();
                    console.log('Boss击杀奖励: 50金币');
                } else {
                    this.coins += 10;
                    console.log('普通击杀奖励: 10金币');
                }
                this.coinsText.setText('金币: ' + this.coins);
                this.score += 10;
                this.scoreText.setText('分数: ' + this.score);
                // 检查成就
                if (this.score >= 1000 && !this.achievements.score1000.unlocked) {
                    this.achievements.score1000.unlock();
                    console.log('解锁成就: 1000分!');
                }
                if (this.score >= 5000 && !this.achievements.score5000.unlocked) {
                    this.achievements.score5000.unlock();
                    console.log('解锁成就: 5000分!');
                }
            }

            // 子弹立即消失
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.destroy();
            return;
        }

        // 检查子弹是否可以穿透
        if (!bullet.canPenetrate(zombie)) {
            console.log('子弹无法穿透，立即消失');
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.destroy();
            return;
        }

        // 记录已击中的僵尸
        bullet.addHitZombie(zombie);

        // 计算伤害
        let damage = bullet.damage;
        if (this.skills.doubleDamage) {
            damage *= 2;
        }

        // 控制台输出伤害信息
        console.log('----------------------------------------');
        console.log(`僵尸类型: ${zombie.type}`);
        console.log(`当前生命值: ${zombie.hp}`);
        console.log(`受到伤害: ${damage}`);
        console.log(`剩余生命值: ${zombie.hp - damage}`);
        console.log(`子弹类型: ${bullet.type}`);
        console.log(`是否暴击: ${this.skills.doubleDamage ? '是' : '否'}`);
        console.log(`子弹剩余穿透次数: ${bullet.maxPenetration - bullet.penetration}`);
        console.log('----------------------------------------');

        // 应用伤害
        zombie.takeDamage(damage);
        
        if (zombie.hp <= 0) {
            console.log(`僵尸死亡! 类型: ${zombie.type}`);
            // 如果当前目标僵尸死亡，重置目标
            if (this.currentTargetZombie === zombie) {
                this.currentTargetZombie = null;
                this.hasClickTarget = false;
            }
            zombie.die();
            // 掉落金币
            if (zombie.type === 'boss') {
                this.coins += 50;
                this.achievements.bossKill.unlock();
                console.log('Boss击杀奖励: 50金币');
            } else {
                this.coins += 10;
                console.log('普通击杀奖励: 10金币');
            }
            this.coinsText.setText('金币: ' + this.coins);
            this.score += 10;
            this.scoreText.setText('分数: ' + this.score);
            // 检查成就
            if (this.score >= 1000 && !this.achievements.score1000.unlocked) {
                this.achievements.score1000.unlock();
                console.log('解锁成就: 1000分!');
            }
            if (this.score >= 5000 && !this.achievements.score5000.unlocked) {
                this.achievements.score5000.unlock();
                console.log('解锁成就: 5000分!');
            }
        }

        // 检查子弹是否应该销毁
        if (bullet.shouldDestroy()) {
            console.log('子弹达到最大穿透次数，立即消失');
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.destroy();
        }
    }

    // 新增：成就提示显示方法
    private showAchievementTip(text: string) {
        this.achievementTipText.setText(text);
        this.achievementTipText.setAlpha(1);
        this.achievementTipText.y = this.viewY + 40;
        this.tweens.add({
            targets: this.achievementTipText,
            alpha: 0,
            y: this.viewY - 20,
            duration: 2000,
            ease: 'Cubic.easeIn',
        });
    }

    // 新增：技能提示显示方法
    private showSkillTip(text: string) {
        this.skillTipText.setText(text);
        this.skillTipText.setAlpha(1);
        this.skillTipText.y = this.viewY + 40;
        this.tweens.add({
            targets: this.skillTipText,
            alpha: 0,
            y: this.viewY - 20,
            duration: 2000,
            ease: 'Cubic.easeIn',
        });
    }

    // 找到点击位置到射击直线最近的僵尸
    private findNearestZombieOnLine(): Phaser.Physics.Arcade.Sprite | null {
        if (!this.hasClickTarget) return null;

        let nearestZombie: Phaser.Physics.Arcade.Sprite | null = null;
        let minDistance = Infinity;

        // 计算从玩家到点击位置的向量
        const dx = this.lastClickX - this.player.x;
        const dy = this.lastClickY - this.player.y;
        const lineLength = Math.sqrt(dx * dx + dy * dy);

        // 如果点击位置太近，不进行瞄准
        if (lineLength < 50) return null;

        this.zombies.getChildren().forEach((zombie) => {
            const sprite = zombie as Phaser.Physics.Arcade.Sprite;
            if (sprite.active) {
                // 计算僵尸到玩家-点击直线的距离
                const px = sprite.x - this.player.x;
                const py = sprite.y - this.player.y;
                
                // 计算投影点
                const t = (px * dx + py * dy) / (lineLength * lineLength);
                const projX = this.player.x + t * dx;
                const projY = this.player.y + t * dy;
                
                // 计算僵尸到投影点的距离
                const distX = sprite.x - projX;
                const distY = sprite.y - projY;
                const distance = Math.sqrt(distX * distX + distY * distY);
                
                // 如果僵尸在射击方向上（投影点在玩家和点击位置之间）
                // 并且距离在合理范围内（比如100像素以内）
                if (t >= 0 && t <= 1 && distance < 100 && distance < minDistance) {
                    minDistance = distance;
                    nearestZombie = sprite;
                }
            }
        });

        return nearestZombie;
    }
}