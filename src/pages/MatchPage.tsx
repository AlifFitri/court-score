import React, { useState } from 'react';
import { Match, Player, ModalState } from '../types';
import { generateId, formatDate, determineMatchWinner } from '../utils';
import MatchModal from '../components/matches/MatchModal';
import './MatchPage.css';

// Mock data for initial development
const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Alex Chen',
    avatar: '👨',
    matches: 15,
    wins: 12,
    losses: 3,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    avatar: '👩',
    matches: 18,
    wins: 15,
    losses: 3,
    createdAt: new Date('2024-01-20')
  },
  {
    id: '3',
    name: 'Mike Rodriguez',
    avatar: '👨‍🦱',
    matches: 12,
    wins: 8,
    losses: 4,
    createdAt: new Date('2024-02-01')
  },
  {
    id: '4',
    name: 'Emma Wilson',
    avatar: '👩‍🦰',
    matches: 10,
    wins: 6,
    losses: 4,
    createdAt: new Date('2024-02-10')
  }
];

const initialMatches: Match[] = [
  {
    id: '1',
    date: new Date('2024-03-01T14:00:00'),
    team1: {
      players: [mockPlayers[0], mockPlayers[1]],
      score: 21
    },
    team2: {
      players: [mockPlayers[2], mockPlayers[3]],
      score: 18
    },
    createdAt: new Date('2024-03-01')
  },
  {
    id: '2',
    date: new Date('2024-03-02T16:30:00'),
    team1: {
      players: [mockPlayers[0]],
      score: 21
    },
    team2: {
      players: [mockPlayers[2]],
      score: 19
    },
    createdAt: new Date('2024-03-02')
  }
];

// Match page component for managing matches
const MatchPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [players] = useState<Player[]>(mockPlayers);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'create'
  });
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Open create match modal
  const handleCreateMatch = () => {
    setSelectedMatch(null);
    setModalState({ isOpen: true, type: 'create' });
  };

  // Open edit match modal
  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match);
    setModalState({ isOpen: true, type: 'edit', data: match });
  };

  // Handle delete match
  const handleDeleteMatch = (matchId: string) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      setMatches(matches.filter(match => match.id !== matchId));
    }
  };

  // Handle save match (create or update)
  const handleSaveMatch = (matchData: any) => {
    if (modalState.type === 'create') {
      // Create new match
      const newMatch: Match = {
        id: generateId(),
        date: matchData.date,
        team1: {
          players: matchData.team1Players,
          score: matchData.team1Score
        },
        team2: {
          players: matchData.team2Players,
          score: matchData.team2Score
        },
        createdAt: new Date()
      };
      setMatches([...matches, newMatch]);
    } else if (modalState.type === 'edit' && selectedMatch) {
      // Update existing match
      setMatches(matches.map(match =>
        match.id === selectedMatch.id
          ? {
              ...match,
              date: matchData.date,
              team1: {
                players: matchData.team1Players,
                score: matchData.team1Score
              },
              team2: {
                players: matchData.team2Players,
                score: matchData.team2Score
              }
            }
          : match
      ));
    }
    setModalState({ ...modalState, isOpen: false });
  };

  // Close modal
  const handleCloseModal = () => {
    setModalState({ ...modalState, isOpen: false });
    setSelectedMatch(null);
  };

  // Get player names for display
  const getPlayerNames = (players: Player[]): string => {
    return players.map(player => player.name).join(' & ');
  };

  // Get winner information
  const getWinnerInfo = (match: Match) => {
    const winner = determineMatchWinner(match.team1.score, match.team2.score);
    if (winner === 1) {
      return { team: match.team1, isWinner: true };
    } else if (winner === 2) {
      return { team: match.team2, isWinner: true };
    }
    return { team: null, isWinner: false };
  };

  return (
    <div className="match-page">
      <div className="page-header">
        <h1>Matches</h1>
        <p>Manage and track badminton matches</p>
      </div>

      <div className="match-actions">
        <button
          className="btn btn-primary"
          onClick={handleCreateMatch}
        >
          + Create Match
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <h3>No Matches Yet</h3>
          <p>Create your first match to get started</p>
          <button
            className="btn btn-primary mt-2"
            onClick={handleCreateMatch}
          >
            Create First Match
          </button>
        </div>
      ) : (
        <div className="matches-list">
          {matches.map((match) => {
            const winnerInfo = getWinnerInfo(match);
            return (
              <div key={match.id} className="match-card">
                <div className="match-header">
                  <div className="match-date">
                    {formatDate(match.date)}
                  </div>
                  <div className="match-actions">
                    <button
                      className="btn btn-outline btn-small"
                      onClick={() => handleEditMatch(match)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-outline btn-small"
                      onClick={() => handleDeleteMatch(match.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="match-content">
                  <div className={`team ${winnerInfo.team === match.team1 ? 'winner' : ''}`}>
                    <div className="team-players">
                      {match.team1.players.map((player, index) => (
                        <div key={player.id} className="player-badge">
                          <span className="player-avatar">{player.avatar}</span>
                          <span className="player-name">{player.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="team-score">
                      {match.team1.score}
                    </div>
                  </div>

                  <div className="match-vs">VS</div>

                  <div className={`team ${winnerInfo.team === match.team2 ? 'winner' : ''}`}>
                    <div className="team-players">
                      {match.team2.players.map((player, index) => (
                        <div key={player.id} className="player-badge">
                          <span className="player-avatar">{player.avatar}</span>
                          <span className="player-name">{player.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="team-score">
                      {match.team2.score}
                    </div>
                  </div>
                </div>

                <div className="match-footer">
                  <div className="match-result">
                    {winnerInfo.isWinner ? (
                      <span className="winner-badge">
                        🏆 {getPlayerNames(winnerInfo.team!.players)} won
                      </span>
                    ) : (
                      <span className="draw-badge">Draw</span>
                    )}
                  </div>
                  <div className="match-created">
                    Created {formatDate(match.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Match Modal */}
      <MatchModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        match={selectedMatch}
        players={players}
        onSave={handleSaveMatch}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default MatchPage;
