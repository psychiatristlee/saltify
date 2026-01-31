// Character progression system (LoL-style RPG)

export interface CharacterData {
  level: number;
  exp: number;
}

export interface CharacterStats {
  level: number;
  exp: number;
  expToNext: number;
  scoreMultiplier: number;
  bonusMoves: number;
  comboBonus: number;
}

// EXP needed for next level: 100 + (level-1) * 50
export function getExpToNext(level: number): number {
  return 100 + (level - 1) * 50;
}

// Compute derived stats from level
export function computeStats(data: CharacterData): CharacterStats {
  const { level, exp } = data;
  return {
    level,
    exp,
    expToNext: getExpToNext(level),
    scoreMultiplier: 1.0 + level * 0.02,   // Lv1=1.02, Lv50=2.0
    bonusMoves: Math.floor(level / 5),      // Lv5=+1, Lv50=+10
    comboBonus: Math.floor(level / 10),     // Lv10=+1, Lv50=+5
  };
}

// Calculate EXP earned from a game session
export function calculateExpEarned(score: number, levelReached: number, crushCount: number): number {
  return Math.floor(score * 0.1) + levelReached * 50 + crushCount;
}

// Process EXP gain, handling multiple level-ups
export function addExp(data: CharacterData, amount: number): { newData: CharacterData; levelsGained: number } {
  let { level, exp } = data;
  exp += amount;
  let levelsGained = 0;
  const MAX_LEVEL = 50;

  while (level < MAX_LEVEL) {
    const needed = getExpToNext(level);
    if (exp >= needed) {
      exp -= needed;
      level += 1;
      levelsGained += 1;
    } else {
      break;
    }
  }

  // Cap at max level
  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    exp = 0;
  }

  return { newData: { level, exp }, levelsGained };
}

export function createInitialCharacter(): CharacterData {
  return { level: 1, exp: 0 };
}
