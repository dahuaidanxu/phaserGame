export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  skill: string;
  category: 'weapon' | 'defense' | 'utility' | 'ultimate';
  unlockCondition?: {
    type: 'wave' | 'score' | 'killCount';
    value: number;
  };
  discount?: number; // 0-1之间的折扣值
  preview?: {
    icon: string;
    animation?: string;
  };
}

export interface ShopConfig {
  items: ShopItem[];
  categories: {
    weapon: string;
    defense: string;
    utility: string;
    ultimate: string;
  };
}

export interface ShopState {
  purchasedItems: Set<string>;
  discounts: Map<string, number>;
  unlockConditions: Map<string, boolean>;
} 