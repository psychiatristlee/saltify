// Consumable items system

export enum ItemType {
  ScoreBoost = 'scoreBoost',
  Hint = 'hint',
  ExtraMoves = 'extraMoves',
}

export interface ItemDef {
  type: ItemType;
  emoji: string;
  nameKey: string;
  descKey: string;
  maxStack: number;
  duration: number; // moves (0 = instant)
}

export const ITEMS: ItemDef[] = [
  {
    type: ItemType.ScoreBoost,
    emoji: '\uD83C\uDF6F',
    nameKey: 'itemScoreBoost',
    descKey: 'itemScoreBoostDesc',
    maxStack: 3,
    duration: 5,
  },
  {
    type: ItemType.Hint,
    emoji: '\uD83C\uDFAF',
    nameKey: 'itemHint',
    descKey: 'itemHintDesc',
    maxStack: 3,
    duration: 3,
  },
  {
    type: ItemType.ExtraMoves,
    emoji: '\u2795',
    nameKey: 'itemExtraMoves',
    descKey: 'itemExtraMovesDesc',
    maxStack: 3,
    duration: 0,
  },
];

export type Inventory = Record<ItemType, number>;

export function createInitialInventory(): Inventory {
  return {
    [ItemType.ScoreBoost]: 0,
    [ItemType.Hint]: 0,
    [ItemType.ExtraMoves]: 0,
  };
}

export function getItemDef(type: ItemType): ItemDef {
  return ITEMS.find((i) => i.type === type)!;
}
