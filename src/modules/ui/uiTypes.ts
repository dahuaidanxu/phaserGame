export type UIType = 'score' | 'wave' | 'health' | 'shield' | 'coins' | 'skillPoints';

export interface UIConfig {
  type: UIType;
  text: string;
  x: number;
  y: number;
  style?: Phaser.Types.GameObjects.Text.TextStyle;
} 