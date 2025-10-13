import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../types';
import { calculatePlayerStats, getMedalClass, calculateWinPercentage } from '../utils';
import { playerService, matchService, convertFromDynamoDBFormat } from '../services/dynamodb';
import './HomePage.css';

// Homepage component showing player rankings
const HomePage: React.FC = () => {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load player stats on component mount from DynamoDB
  useEffect(() => {
    const loadPlayerStats = async () => {
      setIsLoading(true);
      try {
        // Fetch players and matches from DynamoDB
        const players = await playerService.getAllPlayers();
        const matches = await matchService.getAllMatches();
        
        // Convert from DynamoDB format
        const convertedPlayers = players.map(convertFromDynamoDBFormat);
        const convertedMatches = matches.map(convertFromDynamoDBFormat);
        
        // Calculate player stats
        const stats = calculatePlayerStats(convertedPlayers, convertedMatches);
        setPlayerStats(stats);
      } catch (error) {
        console.error('Error loading player stats:', error);
        // Set empty stats on error
        setPlayerStats([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerStats();
  }, []);

  // Render rank with medal for top 3 players
  const renderRank = (rank: number) => {
    if (rank <= 3) {
      const medalClass = getMedalClass(rank);
      return (
        <div className={`medal ${medalClass}`}>
          {rank}
        </div>
      );
    }
    return <span className="rank-number">{rank}</span>;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="home-page">
        <div className="page-header">
          <h1>Player Rankings</h1>
          <p>Current standings based on win percentage</p>
        </div>
        <div className="loading">Loading rankings...</div>
      </div>
    );
  }

  // Render empty state
  if (playerStats.length === 0) {
    return (
      <div className="home-page">
        <div className="page-header">
          <h1>Player Rankings</h1>
          <p>Current standings based on win percentage</p>
        </div>
        <div className="empty-state">
          <h3>No Players Yet</h3>
          <p>Add some players and matches to see rankings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="page-header">
        <h1>Player Rankings</h1>
        <p>Current standings based on win percentage</p>
      </div>

      <div className="table-container">
        <table className="table ranking-table">
          <thead>
            <tr>
              <th className="rank-col">Rank</th>
              <th className="player-col">Player</th>
              <th className="matches-col">Matches</th>
              <th className="wins-col">Wins</th>
              <th className="losses-col">Losses</th>
              <th className="percentage-col">Win %</th>
            </tr>
          </thead>
          <tbody>
            {playerStats.map((stats) => (
              <tr key={stats.player.id} className="ranking-row">
                <td className="rank-cell">
                  {renderRank(stats.rank)}
                </td>
                <td className="player-cell">
                  <div className="player-info">
                    <img 
                      src={stats.player.avatar} 
                      alt={`${stats.player.name} avatar`}
                      className="avatar"
                      onError={(e) => {
                        // Fallback to a placeholder if image fails to load
                        e.currentTarget.src = `https://api.dicebear.com/6.x/identicon/svg?seed=${stats.player.id}&backgroundColor=b6e3f4`;
                      }}
                    />
                    <span className="player-name">{stats.player.name}</span>
                  </div>
                </td>
                <td className="matches-cell">
                  <span className="match-count">{stats.player.matches}</span>
                </td>
                <td className="wins-cell">
                  <span className="win-count">{stats.player.wins}</span>
                </td>
                <td className="losses-cell">
                  <span className="loss-count">{stats.player.losses}</span>
                </td>
                <td className="percentage-cell">
                  <span className="win-percentage">
                    {calculateWinPercentage(stats.player.wins, stats.player.matches)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ranking-footer">
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Players:</span>
            <span className="stat-value">{playerStats.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Matches:</span>
            <span className="stat-value">
              {playerStats.reduce((sum, stats) => sum + stats.player.matches, 0) / 2}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
