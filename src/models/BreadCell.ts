import { BreadType } from './BreadType';

let nextId = 0;

// Special item types with different explosion ranges
// Matcha: 4 match → cross pattern (5 cells)
// Choco: 5 match → 3x3 (9 cells)
// MilkTea: 6+ match → 5x5 (25 cells)
export enum SpecialItemType {
  None = 0,
  Matcha = 1,   // 말차 소금빵 - smallest range
  Choco = 2,    // 초코 크림 큐브빵 - medium range
  MilkTea = 3,  // 밀크티 - largest range
}

export interface BreadCell {
  id: number;
  breadType: BreadType;
  isMatched: boolean;
  specialType: SpecialItemType;
  row: number;
  col: number;
}

export interface Position {
  row: number;
  col: number;
}

export function createBreadCell(
  breadType: BreadType,
  row: number,
  col: number,
  specialType: SpecialItemType = SpecialItemType.None
): BreadCell {
  return {
    id: nextId++,
    breadType,
    isMatched: false,
    specialType,
    row,
    col,
  };
}

export function isSpecialItem(cell: BreadCell): boolean {
  return cell.specialType !== SpecialItemType.None;
}

export function positionKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}
