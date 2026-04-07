// Active skills system

export enum SkillType {
  Bomb = 'bomb',
  Shuffle = 'shuffle',
  LineClear = 'lineClear',
}

export interface SkillDef {
  type: SkillType;
  emoji: string;
  nameKey: string;
  unlockLevel: number;
  cooldown: number;       // moves needed to recharge
  needsTarget: boolean;   // whether skill requires cell tap
}

export const SKILLS: SkillDef[] = [
  {
    type: SkillType.Bomb,
    emoji: '\uD83D\uDD25',
    nameKey: 'skillBomb',
    unlockLevel: 3,
    cooldown: 8,
    needsTarget: true,
  },
  {
    type: SkillType.Shuffle,
    emoji: '\uD83D\uDD00',
    nameKey: 'skillShuffle',
    unlockLevel: 7,
    cooldown: 12,
    needsTarget: false,
  },
  {
    type: SkillType.LineClear,
    emoji: '\u26A1',
    nameKey: 'skillLineClear',
    unlockLevel: 12,
    cooldown: 10,
    needsTarget: true,
  },
];

export interface SkillState {
  type: SkillType;
  currentCooldown: number; // 0 = ready
  unlocked: boolean;
}

export function createSkillStates(characterLevel: number): SkillState[] {
  return SKILLS.map((s) => ({
    type: s.type,
    currentCooldown: 0,
    unlocked: characterLevel >= s.unlockLevel,
  }));
}

export function getSkillDef(type: SkillType): SkillDef {
  return SKILLS.find((s) => s.type === type)!;
}
