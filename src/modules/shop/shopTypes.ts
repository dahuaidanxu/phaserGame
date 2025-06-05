export interface ShopItem {
  name: string;
  cost: number;
  skill: string;
}

export interface ShopConfig {
  items: ShopItem[];
} 