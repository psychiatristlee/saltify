import { useState, useCallback, useEffect, useRef } from 'react';
import {
  CharacterData,
  CharacterStats,
  computeStats,
  createInitialCharacter,
  addExp,
  calculateExpEarned,
} from '../models/Character';
import { Inventory, ItemType, createInitialInventory } from '../models/Item';
import { SkillState, SkillType, createSkillStates } from '../models/Skill';
import { loadCharacterData, saveCharacterData } from '../services/character';

export interface CharacterManager {
  stats: CharacterStats;
  inventory: Inventory;
  skills: SkillState[];
  showCharLevelUp: boolean;
  charLevelsGained: number;
  lastExpGained: number;
  // Actions
  gainExp: (score: number, levelReached: number, crushCount: number) => Promise<number>;
  useItem: (type: ItemType) => boolean;
  addItem: (type: ItemType, count?: number) => void;
  tickSkillCooldowns: () => void;
  resetSkillCooldown: (type: SkillType) => void;
  activateSkill: (type: SkillType) => boolean;
  dismissCharLevelUp: () => void;
  resetSkillsForNewGame: () => void;
}

export function useCharacter(userId: string | null): CharacterManager {
  const [charData, setCharData] = useState<CharacterData>(createInitialCharacter());
  const [inventory, setInventory] = useState<Inventory>(createInitialInventory());
  const [skills, setSkills] = useState<SkillState[]>(createSkillStates(1));
  const [showCharLevelUp, setShowCharLevelUp] = useState(false);
  const [charLevelsGained, setCharLevelsGained] = useState(0);
  const [lastExpGained, setLastExpGained] = useState(0);
  const loadedRef = useRef(false);

  // Load character data from Firestore
  useEffect(() => {
    if (!userId) {
      loadedRef.current = false;
      setCharData(createInitialCharacter());
      setInventory(createInitialInventory());
      setSkills(createSkillStates(1));
      return;
    }

    if (!loadedRef.current) {
      loadedRef.current = true;
      loadCharacterData(userId).then((data) => {
        setCharData(data.character);
        setInventory(data.inventory);
        setSkills(createSkillStates(data.character.level));
      });
    }
  }, [userId]);

  const stats = computeStats(charData);

  // Gain EXP after a game session
  const gainExp = useCallback(async (score: number, levelReached: number, crushCount: number): Promise<number> => {
    const expAmount = calculateExpEarned(score, levelReached, crushCount);

    setCharData((prev) => {
      const { newData, levelsGained } = addExp(prev, expAmount);

      if (levelsGained > 0) {
        setCharLevelsGained(levelsGained);
        setShowCharLevelUp(true);
        setSkills(createSkillStates(newData.level));
      }

      // Save to Firestore
      if (userId) {
        setInventory((inv) => {
          saveCharacterData(userId, newData, inv);
          return inv;
        });
      }

      return newData;
    });

    setLastExpGained(expAmount);
    return expAmount;
  }, [userId]);

  // Use a consumable item
  const useItem = useCallback((type: ItemType): boolean => {
    let success = false;
    setInventory((prev) => {
      if (prev[type] <= 0) return prev;
      success = true;
      const next = { ...prev, [type]: prev[type] - 1 };
      if (userId) {
        setCharData((cd) => {
          saveCharacterData(userId, cd, next);
          return cd;
        });
      }
      return next;
    });
    return success;
  }, [userId]);

  // Add items to inventory
  const addItem = useCallback((type: ItemType, count: number = 1) => {
    setInventory((prev) => {
      const maxStack = 3;
      const newCount = Math.min(prev[type] + count, maxStack);
      const next = { ...prev, [type]: newCount };
      if (userId) {
        setCharData((cd) => {
          saveCharacterData(userId, cd, next);
          return cd;
        });
      }
      return next;
    });
  }, [userId]);

  // Tick all skill cooldowns by 1 (called on each valid swap)
  const tickSkillCooldowns = useCallback(() => {
    setSkills((prev) =>
      prev.map((s) => ({
        ...s,
        currentCooldown: Math.max(0, s.currentCooldown - 1),
      }))
    );
  }, []);

  // Set a skill to full cooldown (after use)
  const resetSkillCooldown = useCallback((type: SkillType) => {
    setSkills((prev) =>
      prev.map((s) => {
        if (s.type !== type) return s;
        const def = { bomb: 8, shuffle: 12, lineClear: 10 }[type];
        return { ...s, currentCooldown: def };
      })
    );
  }, []);

  // Try to activate a skill (returns true if successful)
  const activateSkill = useCallback((type: SkillType): boolean => {
    const skill = skills.find((s) => s.type === type);
    if (!skill || !skill.unlocked || skill.currentCooldown > 0) return false;
    return true;
  }, [skills]);

  const dismissCharLevelUp = useCallback(() => {
    setShowCharLevelUp(false);
    setCharLevelsGained(0);
  }, []);

  const resetSkillsForNewGame = useCallback(() => {
    setSkills((prev) => prev.map((s) => ({ ...s, currentCooldown: 0 })));
  }, []);

  return {
    stats,
    inventory,
    skills,
    showCharLevelUp,
    charLevelsGained,
    lastExpGained,
    gainExp,
    useItem,
    addItem,
    tickSkillCooldowns,
    resetSkillCooldown,
    activateSkill,
    dismissCharLevelUp,
    resetSkillsForNewGame,
  };
}
