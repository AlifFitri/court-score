// Player data type
export interface Player {
  id: string;
  name: string;
  avatar: string;
  matches: number;
  wins: number;
  losses: number;
  /** Cumulative net match adjustments; leaderboard total pts = 100 + this value */
  rankingAdjustmentTotal?: number;
  /** Net upset modifiers only (+bonus / −penalty) */
  rankingBonusTotal?: number;
  createdAt: Date;
}

// Team data type for matches
export interface Team {
  players: Player[];
  score: number;
}

// Match data type
export interface Match {
  id: string;
  date: Date;
  team1: Team;
  team2: Team;
  createdAt: Date;
}

// Player leaderboard row (ranked cohort or provisional <3 matches)
export interface PlayerRankingDisplay {
  player: Player;
  rank: number;
  provisional: boolean;
  /** Shown leaderboard total pts = 100 + rankingAdjustmentTotal */
  cumulativePoints: number;
}

// Form data types
export interface CreatePlayerData {
  name: string;
  avatar: string;
}

export interface CreateMatchData {
  date: Date;
  team1Players: Player[];
  team2Players: Player[];
  team1Score: number;
  team2Score: number;
}

// Modal state types
export interface ModalState {
  isOpen: boolean;
  type: 'create' | 'edit' | 'delete';
  data?: any;
}
