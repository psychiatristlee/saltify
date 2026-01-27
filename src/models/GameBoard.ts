import { BreadCell, Position, createBreadCell, positionKey } from './BreadCell';
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

export function findMatches(cells: Board): Position[] {
  const matched = new Set<string>();

  // 가로 매칭 (3개 이상)
  for (let row = 0; row < ROWS; row++) {
    let col = 0;
    while (col < COLS - 2) {
      const type = cells[row][col].breadType;
      let matchLength = 1;
      while (col + matchLength < COLS && cells[row][col + matchLength].breadType === type) {
        matchLength++;
      }
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matched.add(positionKey({ row, col: col + i }));
        }
      }
      col += Math.max(matchLength, 1);
    }
  }

  // 세로 매칭 (3개 이상)
  for (let col = 0; col < COLS; col++) {
    let row = 0;
    while (row < ROWS - 2) {
      const type = cells[row][col].breadType;
      let matchLength = 1;
      while (row + matchLength < ROWS && cells[row + matchLength][col].breadType === type) {
        matchLength++;
      }
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matched.add(positionKey({ row: row + i, col }));
        }
      }
      row += Math.max(matchLength, 1);
    }
  }

  return Array.from(matched).map((key) => {
    const [r, c] = key.split(',').map(Number);
    return { row: r, col: c };
  });
}

export function swapCells(cells: Board, from: Position, to: Position): Board {
  const newCells = cloneBoard(cells);
  const tempType = newCells[from.row][from.col].breadType;
  newCells[from.row][from.col].breadType = newCells[to.row][to.col].breadType;
  newCells[to.row][to.col].breadType = tempType;
  return newCells;
}

export function removeMatches(cells: Board, positions: Position[]): {
  board: Board;
  crushCounts: BreadCrushCounts;
} {
  const newCells = cloneBoard(cells);
  const crushCounts = createEmptyCrushCounts();

  for (const pos of positions) {
    const breadType = newCells[pos.row][pos.col].breadType;
    crushCounts[breadType]++;
    newCells[pos.row][pos.col].isMatched = true;
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
          newCells[emptyRow][col].isMatched = false;
        }
        emptyRow--;
      }
    }
    for (let row = 0; row <= emptyRow; row++) {
      newCells[row][col].breadType = randomBreadType();
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
