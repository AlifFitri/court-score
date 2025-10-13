import React, { useState, useEffect } from 'react';
import { Match, Player, ModalState } from '../types';
import { generateId, formatDate, determineMatchWinner } from '../utils';
import MatchModal from '../components/matches/MatchModal';
import { matchService, playerService, convertToDynamoDBFormat, convertFromDynamoDBFormat } from '../services/dynamodb';
import './MatchPage.css';

// Match page component for managing matches
const MatchPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'create'
  });
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load matches and players from DynamoDB on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load players and matches from DynamoDB
        const [playersData, matchesData] = await Promise.all([
          playerService.getAllPlayers(),
          matchService.getAllMatches()
        ]);
        
        // Convert from DynamoDB format
        const convertedPlayers = playersData.map(convertFromDynamoDBFormat);
        const convertedMatches = matchesData.map(convertFromDynamoDBFormat);
        
        setPlayers(convertedPlayers);
        setMatches(convertedMatches);
      } catch (error) {
        console.error('Error loading data:', error);
        // Set empty data on error
        setPlayers([]);
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
  const handleDeleteMatch = async (matchId: string) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      try {
        await matchService.deleteMatch(matchId);
        setMatches(matches.filter(match => match.id !== matchId));
      } catch (error) {
        console.error('Error deleting match:', error);
        alert('Failed to delete match. Please try again.');
      }
    }
  };

  // Handle save match (create or update)
  const handleSaveMatch = async (matchData: any) => {
    try {
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
        
        // Save to DynamoDB
        const matchForDB = convertToDynamoDBFormat(newMatch);
        await matchService.createMatch(matchForDB);
        
        // Update local state
        setMatches([...matches, newMatch]);
      } else if (modalState.type === 'edit' && selectedMatch) {
        // Update existing match
        const updatedMatch = {
          ...selectedMatch,
          date: matchData.date,
          team1: {
            players: matchData.team1Players,
            score: matchData.team1Score
          },
          team2: {
            players: matchData.team2Players,
            score: matchData.team2Score
          }
        };
        
        // Save to DynamoDB
        const matchForDB = convertToDynamoDBFormat(updatedMatch);
        await matchService.updateMatch(selectedMatch.id, matchForDB);
        
        // Update local state
        setMatches(matches.map(match =>
          match.id === selectedMatch.id
            ? updatedMatch
            : match
        ));
      }
      setModalState({ ...modalState, isOpen: false });
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Failed to save match. Please try again.');
    }
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

      {isLoading ? (
        <div className="loading">Loading matches...</div>
      ) : matches.length === 0 ? (
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
