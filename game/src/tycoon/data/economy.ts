/**
 * Tycoon mode economy.
 *
 * Each tray = 6 breads of one type. Baking a tray instantly debits the
 * tray cost from cash (this stands in for buying ingredients), then the
 * tray cooks for `bakeTimeMs` and deposits 6 breads onto the shelf.
 *
 * Margins (sell-through of one tray vs. cost):
 *   plain         18,000 −  4,500 = 13,500 (75 %)
 *   everything    21,000 −  5,500 = 15,500 (74 %)
 *   olive-cheese  22,800 −  7,000 = 15,800 (69 %)
 *   basil-tomato  22,800 −  7,000 = 15,800 (69 %)
 *   garlic-butter 25,800 −  6,500 = 19,300 (75 %)
 *   seed-hotteok  25,800 −  7,500 = 18,300 (71 %)
 *   choco-bun     25,800 −  7,500 = 18,300 (71 %)
 *
 * Daily wages of 30,000 means even on a slow day you must move 2-3 full
 * trays just to cover staff, which keeps cash management interesting.
 */

import { BreadType } from '../../models/BreadType';

export interface BreadEconomy {
  costPerTray: number;
  bakeTimeMs: number;
  breadsPerTray: number;
}

export const BREAD_ECONOMY: Record<BreadType, BreadEconomy> = {
  [BreadType.Plain]:        { costPerTray: 4500, bakeTimeMs: 6000, breadsPerTray: 6 },
  [BreadType.Everything]:   { costPerTray: 5500, bakeTimeMs: 7000, breadsPerTray: 6 },
  [BreadType.OliveCheese]:  { costPerTray: 7000, bakeTimeMs: 8000, breadsPerTray: 6 },
  [BreadType.BasilTomato]:  { costPerTray: 7000, bakeTimeMs: 8000, breadsPerTray: 6 },
  [BreadType.GarlicButter]: { costPerTray: 6500, bakeTimeMs: 8000, breadsPerTray: 6 },
  [BreadType.Hotteok]:      { costPerTray: 7500, bakeTimeMs: 9000, breadsPerTray: 6 },
  [BreadType.ChocoBun]:     { costPerTray: 7500, bakeTimeMs: 9000, breadsPerTray: 6 },
};

export const STARTING_CASH = 50_000;
export const DAILY_WAGES = 30_000;
export const OVEN_SLOT_COUNT = 2;

/** Initial stock at the start of each day, per bread type. */
export const STARTING_STOCK = 2;
/** Maximum stock per slot (shelf capacity). */
export const MAX_STOCK_PER_SLOT = 8;
