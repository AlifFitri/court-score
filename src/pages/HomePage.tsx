import React, { useState, useEffect, useCallback } from 'react';
import type { Match, Player } from '../types';
import {
  PlayerRankingRow,
  buildLeaderboardRows,
  formatLeaderboardPoints,
  buildPlayerMatchLedger,
  type PlayerMatchLedgerEntry,
} from '../utils/ranking';
import { getMedalClass } from '../utils';
import { playerService, matchService, convertFromDynamoDBFormat } from '../services/dynamodb';
import PlayerMatchesModal from '../components/home/PlayerMatchesModal';
import './HomePage.css';

const RankingSection: React.FC<{
  title: string;
  description?: string;
  rows: PlayerRankingRow[];
  roster: Player[];
  onOpenPlayerHistory: (player: Player) => void;
}> = ({ title, description, rows, roster, onOpenPlayerHistory }) => {
  const renderRank = (rank: number, provisional: boolean) => {
    if (!provisional && rank <= 3) {
      const medalClass = getMedalClass(rank);
      return (
        <div className={`medal ${medalClass}`}>
          {rank}
        </div>
      );
    }
    return (
      <span className={`rank-number${provisional ? ' rank-number-provisional' : ''}`}>
        {rank}
      </span>
    );
  };

  if (rows.length === 0) return null;

  return (
    <div className="ranking-section">
      <div className="ranking-section-header">
        <h2>{title}</h2>
        {description ? <p className="ranking-section-description">{description}</p> : null}
      </div>
      <div className="table-container">
        <table className="table ranking-table">
          <thead>
            <tr>
              <th className="rank-col">Rank</th>
              <th className="player-col">Player</th>
              <th className="matches-col">
                <span className="col-full">Matches</span>
                <span className="col-short">M</span>
              </th>
              <th className="wins-col">
                <span className="col-full">Wins</span>
                <span className="col-short">W</span>
              </th>
              <th className="losses-col">
                <span className="col-full">Losses</span>
                <span className="col-short">L</span>
              </th>
              <th className="percentage-col points-col">
                <span className="col-full">Points</span>
                <span className="col-short">Pts</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((stats) => (
              <tr
                key={stats.player.id}
                className={`ranking-row${stats.provisional ? ' ranking-row-provisional' : ''}`}
              >
                <td className="rank-cell">
                  {renderRank(stats.cohortRank, stats.provisional)}
                </td>
                <td className="player-cell">
                  <div className="home-player-info">
                    <img
                      src={stats.player.avatar}
                      alt={`${stats.player.name} avatar`}
                      className="home-avatar"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/6.x/identicon/svg?seed=${stats.player.id}&backgroundColor=b6e3f4`;
                      }}
                    />
                    <button
                      type="button"
                      className="home-player-name-btn"
                      onClick={() =>
                        onOpenPlayerHistory(
                          roster.find((p) => p.id === stats.player.id) ?? stats.player
                        )
                      }
                    >
                      {stats.player.name}
                    </button>
                  </div>
                </td>
                <td className="matches-cell">
                  <span className="match-count">{stats.snapshot.matches}</span>
                </td>
                <td className="wins-cell">
                  <span className="win-count">{stats.snapshot.wins}</span>
                </td>
                <td className="losses-cell">
                  <span className="loss-count">{stats.snapshot.losses}</span>
                </td>
                <td className="percentage-cell points-cell">
                  <span
                    className="win-percentage"
                    title={
                      stats.snapshot.matches > 0
                        ? `Total cumulative points (100 starting + Σ match changes): ${stats.snapshot.cumulativePoints}. Sorting uses average gain per match: ${stats.snapshot.sortScore.toFixed(2)}.`
                        : 'No recorded matches yet'
                    }
                  >
                    {formatLeaderboardPoints(stats.snapshot.cumulativePoints, stats.snapshot.matches)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [playersRoster, setPlayersRoster] = useState<Player[]>([]);
  const [matchesList, setMatchesList] = useState<Match[]>([]);
  const [leaderboardRanked, setLeaderboardRanked] = useState<PlayerRankingRow[]>([]);
  const [leaderboardProvisional, setLeaderboardProvisional] = useState<PlayerRankingRow[]>([]);
  const [totalPlayersWithRows, setTotalPlayersWithRows] = useState(0);
  const [distinctMatches, setDistinctMatches] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPlayer, setHistoryPlayer] = useState<Player | null>(null);
  const [historyEntries, setHistoryEntries] = useState<PlayerMatchLedgerEntry[]>([]);

  const openPlayerHistory = useCallback(
    (player: Player) => {
      const entries = buildPlayerMatchLedger(playersRoster, matchesList, player.id);
      setHistoryEntries(entries);
      setHistoryPlayer(player);
      setHistoryModalOpen(true);
    },
    [playersRoster, matchesList]
  );

  const closePlayerHistory = useCallback(() => {
    setHistoryModalOpen(false);
    setHistoryPlayer(null);
    setHistoryEntries([]);
  }, []);

  useEffect(() => {
    const loadPlayerStats = async () => {
      setIsLoading(true);
      try {
        const players = await playerService.getAllPlayers();
        const matches = await matchService.getAllMatches();

        const convertedPlayers = players.map((p) => convertFromDynamoDBFormat<Player>(p));
        const convertedMatches = matches.map((m) => convertFromDynamoDBFormat<Match>(m));

        const rows = buildLeaderboardRows(convertedPlayers, convertedMatches);
        setPlayersRoster(convertedPlayers);
        setMatchesList(convertedMatches);
        setLeaderboardRanked(rows.filter((r) => !r.provisional));
        setLeaderboardProvisional(rows.filter((r) => r.provisional));
        setTotalPlayersWithRows(rows.length);
        setDistinctMatches(convertedMatches.length);
      } catch (error) {
        console.error('Error loading player stats:', error);
        setPlayersRoster([]);
        setMatchesList([]);
        setLeaderboardRanked([]);
        setLeaderboardProvisional([]);
        setTotalPlayersWithRows(0);
        setDistinctMatches(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerStats();
  }, []);

  if (isLoading) {
    return (
      <div className="home-page">
        <div className="home-page-header">
          <h1>Player Rankings</h1>
          <p>
            Starts at 100 and adds each match adjustment; leaderboard order favors higher momentum (net
            change ÷ matches).
          </p>
        </div>
        <div className="loading">Loading rankings...</div>
      </div>
    );
  }

  if (totalPlayersWithRows === 0) {
    return (
      <div className="home-page">
        <div className="home-page-header">
          <h1>Player Rankings</h1>
          <p>
            Sorted by cumulative total points starting at 100; table order favors higher net gain per
            match played.
          </p>
        </div>
        <div className="home-empty-state">
          <h3>No Players Yet</h3>
          <p>Add some players and matches to see rankings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-page-header">
        <h1>Player Rankings</h1>
        <p>
          Each player’s score starts at 100 and increases or decreases after each counted match (+3 wins, −1
          losses, with upset tiers). The Points column shows 100 plus the running sum of those match
          changes (so sums match what you see in the match history popup). Ranking order favors players who
          earn higher net points per match on average.
        </p>
      </div>

      <RankingSection
        title="Leaderboard"
        description="Ranked players with three or more matches. Click a name to view match breakdown."
        rows={leaderboardRanked}
        roster={playersRoster}
        onOpenPlayerHistory={openPlayerHistory}
      />

      {leaderboardRanked.length === 0 && leaderboardProvisional.length > 0 ? (
        <p className="ranking-placeholder">
          Nobody has reached three matches yet. Once they do, they will appear in this leaderboard.
        </p>
      ) : null}

      <RankingSection
        title="Provisional (unranked)"
        description="Fewer than three matches completed — click a name to see each match detail."
        rows={leaderboardProvisional}
        roster={playersRoster}
        onOpenPlayerHistory={openPlayerHistory}
      />

      <PlayerMatchesModal
        isOpen={historyModalOpen}
        player={historyPlayer}
        entries={historyEntries}
        onClose={closePlayerHistory}
      />

      <div className="ranking-footer">
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Players:</span>
            <span className="stat-value">{totalPlayersWithRows}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Matches:</span>
            <span className="stat-value">{distinctMatches}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
