export interface GameRecord {
  id?: string;
  userId: string;
  score: number;
  level: number;
  saltBreadCrushed: number;
  timestamp: Date;
}

export interface UserStats {
  highScore: number;
  highLevel: number;
  totalGamesPlayed: number;
  totalSaltBreadCrushed: number;
  lastPlayedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL: string | null;
  highScore: number;
  highLevel: number;
}

export interface ScoreService {
  saveGameRecord(record: Omit<GameRecord, 'id' | 'timestamp'>): Promise<string>;
  getUserStats(userId: string): Promise<UserStats | null>;
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getUserGameHistory(userId: string, limit?: number): Promise<GameRecord[]>;
}
