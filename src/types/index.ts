// Player data type
export interface Player {
  id: string;
  name: string;
  avatar: string;
  matches: number;
  wins: number;
  losses: number;
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

// Player statistics for ranking
export interface PlayerStats {
  player: Player;
  rank: number;
  winPercentage: number;
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
