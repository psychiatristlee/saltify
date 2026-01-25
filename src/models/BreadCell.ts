import { BreadType } from './BreadType';

let nextId = 0;

export interface BreadCell {
  id: number;
  breadType: BreadType;
  isMatched: boolean;
  row: number;
  col: number;
}

export interface Position {
  row: number;
  col: number;
}

export function createBreadCell(breadType: BreadType, row: number, col: number): BreadCell {
  return {
    id: nextId++,
    breadType,
    isMatched: false,
    row,
    col,
  };
}

export function positionKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}
