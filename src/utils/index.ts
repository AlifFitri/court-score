import { Player, Match, PlayerStats } from '../types';

// Calculate player statistics from matches
export const calculatePlayerStats = (players: Player[], matches: Match[]): PlayerStats[] => {
  const playerStatsMap = new Map<string, PlayerStats>();
  
  // Initialize player stats
  players.forEach(player => {
    playerStatsMap.set(player.id, {
      player,
      rank: 0,
      winPercentage: player.matches > 0 ? (player.wins / player.matches) : 0
    });
  });
  
  // Sort by win percentage (descending)
  const sortedStats = Array.from(playerStatsMap.values()).sort((a, b) => {
    if (a.winPercentage !== b.winPercentage) {
      return b.winPercentage - a.winPercentage;
    }
    // If win percentage is the same, sort by total wins
    return b.player.wins - a.player.wins;
  });
  
  // Assign ranks
  sortedStats.forEach((stats, index) => {
    stats.rank = index + 1;
  });
  
  return sortedStats;
};

// Calculate win percentage with 5 decimal places
export const calculateWinPercentage = (wins: number, matches: number): string => {
  if (matches === 0) return '0.00000';
  const percentage = (wins / matches) * 100;
  return percentage.toFixed(5);
};

// Determine match winner based on badminton rules
export const determineMatchWinner = (team1Score: number, team2Score: number): number => {
  // Badminton rules: best of 3 games, each game to 21 points (must win by 2, max 30)
  // For simplicity, we'll consider the team with higher score as winner
  // In a real implementation, we'd need to validate the score according to badminton rules
  return team1Score > team2Score ? 1 : team1Score < team2Score ? 2 : 0;
};

// Validate badminton score
export const isValidBadmintonScore = (score1: number, score2: number): boolean => {
  // Basic validation - scores should be non-negative
  if (score1 < 0 || score2 < 0) return false;
  
  // In badminton, a game is typically played to 21 points
  // Maximum score is 30 (when deuce continues beyond 29-29)
  if (score1 > 30 || score2 > 30) return false;
  
  // One team must have at least 21 points to win, and must lead by 2 points
  // unless the score reaches 29-29, then next point wins
  const maxScore = Math.max(score1, score2);
  const minScore = Math.min(score1, score2);
  
  if (maxScore < 21) return true; // Game not finished yet
  
  if (maxScore === 21 && minScore <= 19) return true;
  if (maxScore > 21 && maxScore - minScore === 2) return true;
  if (maxScore === 30 && minScore === 29) return true;
  
  return false;
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Format date for display
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Get medal class based on rank
export const getMedalClass = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'medal-gold';
    case 2:
      return 'medal-silver';
    case 3:
      return 'medal-bronze';
    default:
      return '';
  }
};

// Avatar styles from DiceBear collection
export const avatarStyles = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'avataaars-neutral',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'bottts-neutral',
  'croodles',
  'croodles-neutral',
  'fun-emoji',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'notionists',
  'notionists-neutral',
  'open-peeps',
  'personas',
  'pixel-art',
  'pixel-art-neutral'
];

// Generate avatar URL using DiceBear API
export const generateAvatarUrl = (seed: string, style: string = 'adventurer'): string => {
  return `https://api.dicebear.com/6.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

// Generate multiple avatar options for selection
export const generateAvatarOptions = (count: number = 24): string[] => {
  const options: string[] = [];
  const baseSeeds = [
    'alex', 'bailey', 'casey', 'dakota', 'emerson', 'finley', 'grayson', 'harlow',
    'indigo', 'jordan', 'kendall', 'logan', 'morgan', 'noah', 'peyton', 'quinn',
    'riley', 'sawyer', 'taylor', 'uriel', 'valentina', 'winston', 'xander', 'zephyr'
  ];
  
  const styles = ['adventurer', 'avataaars', 'lorelei', 'micah', 'pixel-art', 'notionists'];
  
  for (let i = 0; i < count; i++) {
    const style = avatarStyles[i % avatarStyles.length];
    const seed = baseSeeds[i % baseSeeds.length] + '-' + i;
    options.push(generateAvatarUrl(seed, style));
  }
  
  return options;
};

// Default avatars for players (using DiceBear generated images)
export const defaultAvatars = generateAvatarOptions(100);

// Get random avatar
export const getRandomAvatar = (): string => {
  const randomIndex = Math.floor(Math.random() * defaultAvatars.length);
  return defaultAvatars[randomIndex];
};
