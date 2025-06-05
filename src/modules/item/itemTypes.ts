export type ItemType = 'health' | 'shield' | 'weapon';

export interface ItemConfig {
  type: ItemType;
  tint?: number;
} 