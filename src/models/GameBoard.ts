import { BreadCell, Position, createBreadCell, positionKey, SpecialItemType, isSpecialItem } from './BreadCell';
import { BreadType, randomBreadType, getAllBreadTypes } from './BreadType';

// Count of crushed breads per type
export type BreadCrushCounts = Record<BreadType, number>;

function createEmptyCrushCounts(): BreadCrushCounts {
  const counts: Partial<BreadCrushCounts> = {};
  getAllBreadTypes().forEach((type) => {
    counts[type] = 0;
  });
  return counts as BreadCrushCounts;
}

export const ROWS = 8;
export const COLS = 7;

export type Board = BreadCell[][];

function cloneBoard(cells: Board): Board {
  return cells.map((row) => row.map((cell) => ({ ...cell })));
}

export function fillBoardWithoutMatches(): Board {
  const cells: Board = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) =>
      createBreadCell(BreadType.Plain, row, col)
    )
  );

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let type = randomBreadType();
      while (hasInitialMatch(cells, row, col, type)) {
        type = randomBreadType();
      }
      cells[row][col] = createBreadCell(type, row, col);
    }
  }

  return cells;
}

function hasInitialMatch(cells: Board, row: number, col: number, type: BreadType): boolean {
  if (col >= 2) {
    if (cells[row][col - 1].breadType === type && cells[row][col - 2].breadType === type) {
      return true;
    }
  }
  if (row >= 2) {
    if (cells[row - 1][col].breadType === type && cells[row - 2][col].breadType === type) {
      return true;
    }
  }
  return false;
}

// Determine special item type based on match length (with chance-based spawning)
// 3 match → 25% chance for Matcha
// 4 match → Matcha (30% chance upgrade to Choco)
// 5 match → Choco (30% chance upgrade to MilkTea)
// 6+ match → MilkTea
function getSpecialItemTypeForMatchLength(matchLength: number): SpecialItemType {
  if (matchLength >= 6) return SpecialItemType.MilkTea;
  if (matchLength >= 5) {
    // 30% chance to upgrade to MilkTea
    return Math.random() < 0.3 ? SpecialItemType.MilkTea : SpecialItemType.Choco;
  }
  if (matchLength >= 4) {
    // 30% chance to upgrade to Choco
    return Math.random() < 0.3 ? SpecialItemType.Choco : SpecialItemType.Matcha;
  }
  if (matchLength >= 3) {
    // 25% chance for Matcha on 3-match
    return Math.random() < 0.25 ? SpecialItemType.Matcha : SpecialItemType.None;
  }
  return SpecialItemType.None;
}

// Get explosion range for each special item type
// Matcha: cross pattern (5 cells)
// Choco: 3x3 (9 cells)
// MilkTea: 5x5 (25 cells)
function getExplosionPositions(center: Position, specialType: SpecialItemType): Position[] {
  const positions: Position[] = [];
  const { row, col } = center;

  switch (specialType) {
    case SpecialItemType.Matcha:
      // Cross pattern: center + 4 adjacent cells
      positions.push({ row, col });
      if (row > 0) positions.push({ row: row - 1, col });
      if (row < ROWS - 1) positions.push({ row: row + 1, col });
      if (col > 0) positions.push({ row, col: col - 1 });
      if (col < COLS - 1) positions.push({ row, col: col + 1 });
      // Extend cross further
      if (row > 1) positions.push({ row: row - 2, col });
      if (row < ROWS - 2) positions.push({ row: row + 2, col });
      if (col > 1) positions.push({ row, col: col - 2 });
      if (col < COLS - 2) positions.push({ row, col: col + 2 });
      break;

    case SpecialItemType.Choco:
      // 3x3 square
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            positions.push({ row: nr, col: nc });
          }
        }
      }
      break;

    case SpecialItemType.MilkTea:
      // 5x5 square
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            positions.push({ row: nr, col: nc });
          }
        }
      }
      break;
  }

  return positions;
}

export interface MatchResult {
  positions: Position[];
  specialSpawnPosition: Position | null;
  specialSpawnType: SpecialItemType;
  specialSpawnBreadType: BreadType | null;
}

export function findMatches(cells: Board): Position[] {
  const result = findMatchesWithInfo(cells);
  return result.positions;
}

export function findMatchesWithInfo(cells: Board): MatchResult {
  const matched = new Set<string>();
  let specialSpawnPosition: Position | null = null;
  let specialSpawnType: SpecialItemType = SpecialItemType.None;
  let specialSpawnBreadType: BreadType | null = null;
  let maxMatchLength = 0;

  // 가로 매칭 (3개 이상)
  for (let row = 0; row < ROWS; row++) {
    let col = 0;
    while (col < COLS - 2) {
      const cell = cells[row][col];
      const type = cell.breadType;
      // Skip special items for normal matching
      if (isSpecialItem(cell)) {
        col++;
        continue;
      }
      let matchLength = 1;
      while (col + matchLength < COLS &&
             cells[row][col + matchLength].breadType === type &&
             !isSpecialItem(cells[row][col + matchLength])) {
        matchLength++;
      }
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matched.add(positionKey({ row, col: col + i }));
        }
        // Check for special item spawn (including 3-match with chance)
        const potentialSpecialType = getSpecialItemTypeForMatchLength(matchLength);
        if (potentialSpecialType !== SpecialItemType.None && matchLength > maxMatchLength) {
          maxMatchLength = matchLength;
          specialSpawnPosition = { row, col: col + Math.floor(matchLength / 2) };
          specialSpawnType = potentialSpecialType;
          specialSpawnBreadType = type;
        }
      }
      col += Math.max(matchLength, 1);
    }
  }

  // 세로 매칭 (3개 이상)
  for (let col = 0; col < COLS; col++) {
    let row = 0;
    while (row < ROWS - 2) {
      const cell = cells[row][col];
      const type = cell.breadType;
      // Skip special items for normal matching
      if (isSpecialItem(cell)) {
        row++;
        continue;
      }
      let matchLength = 1;
      while (row + matchLength < ROWS &&
             cells[row + matchLength][col].breadType === type &&
             !isSpecialItem(cells[row + matchLength][col])) {
        matchLength++;
      }
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matched.add(positionKey({ row: row + i, col }));
        }
        // Check for special item spawn (including 3-match with chance)
        const potentialSpecialType = getSpecialItemTypeForMatchLength(matchLength);
        if (potentialSpecialType !== SpecialItemType.None && matchLength > maxMatchLength) {
          maxMatchLength = matchLength;
          specialSpawnPosition = { row: row + Math.floor(matchLength / 2), col };
          specialSpawnType = potentialSpecialType;
          specialSpawnBreadType = type;
        }
      }
      row += Math.max(matchLength, 1);
    }
  }

  // Collect all special items that need to explode
  const specialItemsToExplode: { pos: Position; type: SpecialItemType }[] = [];

  // Check if any special items are in matched positions
  matched.forEach((key) => {
    const [r, c] = key.split(',').map(Number);
    if (isSpecialItem(cells[r][c])) {
      specialItemsToExplode.push({
        pos: { row: r, col: c },
        type: cells[r][c].specialType,
      });
    }
  });

  // Also check if special items are adjacent to matched cells
  matched.forEach((key) => {
    const [r, c] = key.split(',').map(Number);
    const adjacentPositions = [
      { row: r - 1, col: c },
      { row: r + 1, col: c },
      { row: r, col: c - 1 },
      { row: r, col: c + 1 },
    ];
    for (const adj of adjacentPositions) {
      if (adj.row >= 0 && adj.row < ROWS && adj.col >= 0 && adj.col < COLS) {
        const adjCell = cells[adj.row][adj.col];
        if (isSpecialItem(adjCell) && !adjCell.isMatched) {
          // Check if not already added
          const alreadyAdded = specialItemsToExplode.some(
            (item) => item.pos.row === adj.row && item.pos.col === adj.col
          );
          if (!alreadyAdded) {
            specialItemsToExplode.push({
              pos: adj,
              type: adjCell.specialType,
            });
          }
        }
      }
    }
  });

  // Expand matched area for each special item based on its type
  for (const { pos, type } of specialItemsToExplode) {
    const explosionPositions = getExplosionPositions(pos, type);
    for (const explosionPos of explosionPositions) {
      matched.add(positionKey(explosionPos));
    }
  }

  return {
    positions: Array.from(matched).map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { row: r, col: c };
    }),
    specialSpawnPosition,
    specialSpawnType,
    specialSpawnBreadType,
  };
}

export function swapCells(cells: Board, from: Position, to: Position): Board {
  const newCells = cloneBoard(cells);
  const tempType = newCells[from.row][from.col].breadType;
  const tempSpecial = newCells[from.row][from.col].specialType;
  newCells[from.row][from.col].breadType = newCells[to.row][to.col].breadType;
  newCells[from.row][from.col].specialType = newCells[to.row][to.col].specialType;
  newCells[to.row][to.col].breadType = tempType;
  newCells[to.row][to.col].specialType = tempSpecial;
  return newCells;
}

export function removeMatches(
  cells: Board,
  positions: Position[],
  specialSpawnPosition: Position | null = null,
  specialSpawnType: SpecialItemType = SpecialItemType.None,
  specialSpawnBreadType: BreadType | null = null
): {
  board: Board;
  crushCounts: BreadCrushCounts;
} {
  const newCells = cloneBoard(cells);
  const crushCounts = createEmptyCrushCounts();

  for (const pos of positions) {
    const cell = newCells[pos.row][pos.col];
    // Only count regular breads (not special items) for points
    if (!isSpecialItem(cell)) {
      crushCounts[cell.breadType]++;
    }
    newCells[pos.row][pos.col].isMatched = true;
    newCells[pos.row][pos.col].specialType = SpecialItemType.None;
  }

  // Spawn special item at the 4+ match position
  if (specialSpawnPosition && specialSpawnType !== SpecialItemType.None && specialSpawnBreadType !== null) {
    const { row, col } = specialSpawnPosition;
    newCells[row][col].isMatched = false; // Don't remove this cell
    newCells[row][col].specialType = specialSpawnType;
    newCells[row][col].breadType = specialSpawnBreadType;
    // Remove from crush counts since it's not being removed
    crushCounts[specialSpawnBreadType]--;
  }

  return { board: newCells, crushCounts };
}

export function applyGravity(cells: Board): Board {
  const newCells = cloneBoard(cells);

  for (let col = 0; col < COLS; col++) {
    let emptyRow = ROWS - 1;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newCells[row][col].isMatched) {
        if (emptyRow !== row) {
          newCells[emptyRow][col].breadType = newCells[row][col].breadType;
          newCells[emptyRow][col].specialType = newCells[row][col].specialType;
          newCells[emptyRow][col].isMatched = false;
        }
        emptyRow--;
      }
    }
    for (let row = 0; row <= emptyRow; row++) {
      newCells[row][col].breadType = randomBreadType();
      newCells[row][col].specialType = SpecialItemType.None;
      newCells[row][col].isMatched = false;
    }
  }

  return newCells;
}

export function isAdjacent(a: Position, b: Position): boolean {
  const rowDiff = Math.abs(a.row - b.row);
  const colDiff = Math.abs(a.col - b.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// Check if any valid move exists on the board
export function hasPossibleMoves(cells: Board): boolean {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Try swap right
      if (col < COLS - 1) {
        const swapped = swapCells(cells, { row, col }, { row, col: col + 1 });
        if (findMatches(swapped).length > 0) return true;
      }
      // Try swap down
      if (row < ROWS - 1) {
        const swapped = swapCells(cells, { row, col }, { row: row + 1, col });
        if (findMatches(swapped).length > 0) return true;
      }
    }
  }
  return false;
}

// Find a possible swap (for hint feature)
export function findPossibleSwap(cells: Board): { from: Position; to: Position } | null {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (col < COLS - 1) {
        const swapped = swapCells(cells, { row, col }, { row, col: col + 1 });
        if (findMatches(swapped).length > 0) {
          return { from: { row, col }, to: { row, col: col + 1 } };
        }
      }
      if (row < ROWS - 1) {
        const swapped = swapCells(cells, { row, col }, { row: row + 1, col });
        if (findMatches(swapped).length > 0) {
          return { from: { row, col }, to: { row: row + 1, col } };
        }
      }
    }
  }
  return null;
}

// Shuffle the board while preserving special items
export function shuffleBoard(cells: Board, maxAttempts = 10): Board {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const newCells = cloneBoard(cells);

    // Collect all non-special bread types and their positions
    const regularPositions: Position[] = [];
    const breadTypes: BreadType[] = [];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!isSpecialItem(newCells[row][col])) {
          regularPositions.push({ row, col });
          breadTypes.push(newCells[row][col].breadType);
        }
      }
    }

    // Fisher-Yates shuffle
    for (let i = breadTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [breadTypes[i], breadTypes[j]] = [breadTypes[j], breadTypes[i]];
    }

    // Place shuffled types back
    regularPositions.forEach((pos, idx) => {
      newCells[pos.row][pos.col].breadType = breadTypes[idx];
    });

    // Check if shuffled board has possible moves and no existing matches
    if (findMatches(newCells).length === 0 && hasPossibleMoves(newCells)) {
      return newCells;
    }
  }

  // Fallback: generate a completely new board
  return fillBoardWithoutMatches();
}
