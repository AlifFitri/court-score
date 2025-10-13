import React, { useState, useEffect } from 'react';
import { Match, Player, CreateMatchData } from '../../types';
import { isValidBadmintonScore } from '../../utils';
import './MatchModal.css';

// Props for the MatchModal component
interface MatchModalProps {
  isOpen: boolean;
  type: 'create' | 'edit' | 'delete';
  match: Match | null;
  players: Player[];
  onSave: (matchData: CreateMatchData) => void;
  onClose: () => void;
}

// Match modal component for creating/editing matches
const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  type,
  match,
  players,
  onSave,
  onClose
}) => {
  const [date, setDate] = useState(new Date());
  const [team1Players, setTeam1Players] = useState<Player[]>([]);
  const [team2Players, setTeam2Players] = useState<Player[]>([]);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [errors, setErrors] = useState<{
    team1Players?: string;
    team2Players?: string;
    scores?: string;
  }>({});

  // Initialize form when modal opens or match changes
  useEffect(() => {
    if (isOpen) {
      if (type === 'edit' && match) {
        setDate(new Date(match.date));
        setTeam1Players(match.team1.players);
        setTeam2Players(match.team2.players);
        setTeam1Score(match.team1.score);
        setTeam2Score(match.team2.score);
      } else {
        setDate(new Date());
        setTeam1Players([]);
        setTeam2Players([]);
        setTeam1Score(0);
        setTeam2Score(0);
      }
      setErrors({});
    }
  }, [isOpen, type, match]);

  // Format date for datetime-local input (handles timezone offset)
  const formatDateForInput = (date: Date): string => {
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {
      team1Players?: string;
      team2Players?: string;
      scores?: string;
    } = {};

    // Validate teams
    if (team1Players.length === 0) {
      newErrors.team1Players = 'Team 1 must have at least one player';
    }
    if (team2Players.length === 0) {
      newErrors.team2Players = 'Team 2 must have at least one player';
    }

    // Check for duplicate players
    const allPlayers = [...team1Players, ...team2Players];
    const playerIds = allPlayers.map(p => p.id);
    const uniquePlayerIds = new Set(playerIds);
    if (playerIds.length !== uniquePlayerIds.size) {
      newErrors.team1Players = 'A player cannot be in both teams';
      newErrors.team2Players = 'A player cannot be in both teams';
    }

    // Validate scores
    if (!isValidBadmintonScore(team1Score, team2Score)) {
      newErrors.scores = 'Invalid badminton score. Scores must follow badminton rules (21 points to win, must win by 2, max 30)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        date,
        team1Players,
        team2Players,
        team1Score,
        team2Score
      });
    }
  };

  // Handle adding player to team
  const handleAddPlayerToTeam = (team: 'team1' | 'team2', player: Player) => {
    if (team === 'team1' && team1Players.length < 2) {
      setTeam1Players([...team1Players, player]);
    } else if (team === 'team2' && team2Players.length < 2) {
      setTeam2Players([...team2Players, player]);
    }
  };

  // Handle removing player from team
  const handleRemovePlayerFromTeam = (team: 'team1' | 'team2', playerId: string) => {
    if (team === 'team1') {
      setTeam1Players(team1Players.filter(p => p.id !== playerId));
    } else {
      setTeam2Players(team2Players.filter(p => p.id !== playerId));
    }
  };

  // Get available players (not in any team)
  const getAvailablePlayers = (): Player[] => {
    const selectedPlayerIds = [...team1Players, ...team2Players].map(p => p.id);
    return players.filter(player => !selectedPlayerIds.includes(player.id));
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  const availablePlayers = getAvailablePlayers();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content match-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {type === 'create' ? 'Create New Match' : 'Edit Match'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="match-form">
          {/* Date Input */}
          <div className="form-group">
            <label htmlFor="matchDate" className="form-label">
              Match Date & Time
            </label>
            <input
              type="datetime-local"
              id="matchDate"
              className="form-input"
              value={formatDateForInput(date)}
              onChange={(e) => setDate(new Date(e.target.value))}
            />
          </div>

          {/* Team Selection */}
          <div className="teams-section">
            {/* Team 1 */}
            <div className={`team-section ${errors.team1Players ? 'error' : ''}`}>
              <h3 className="team-title">Team 1</h3>
              <div className="team-players">
                {team1Players.map(player => (
                  <div key={player.id} className="selected-player">
                    <span className="player-avatar">
                      <img 
                        src={player.avatar} 
                        alt={`${player.name} avatar`}
                        className="avatar-image"
                        onError={(e) => {
                          // Fallback to a placeholder if image fails to load
                          e.currentTarget.src = `https://api.dicebear.com/6.x/identicon/svg?seed=${player.id}&backgroundColor=b6e3f4`;
                        }}
                      />
                    </span>
                    <span className="player-name">{player.name}</span>
                    <button
                      type="button"
                      className="remove-player"
                      onClick={() => handleRemovePlayerFromTeam('team1', player.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {team1Players.length < 2 && availablePlayers.length > 0 && (
                  <select
                    className="player-select"
                    value=""
                    onChange={(e) => {
                      const player = players.find(p => p.id === e.target.value);
                      if (player) handleAddPlayerToTeam('team1', player);
                      e.target.value = '';
                    }}
                  >
                    <option value="">Add player...</option>
                    {availablePlayers.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {errors.team1Players && (
                <span className="error-message">{errors.team1Players}</span>
              )}
            </div>

            {/* VS Separator */}
            <div className="vs-separator">VS</div>

            {/* Team 2 */}
            <div className={`team-section ${errors.team2Players ? 'error' : ''}`}>
              <h3 className="team-title">Team 2</h3>
              <div className="team-players">
                {team2Players.map(player => (
                  <div key={player.id} className="selected-player">
                    <span className="player-avatar">
                      <img 
                        src={player.avatar} 
                        alt={`${player.name} avatar`}
                        className="avatar-image"
                        onError={(e) => {
                          // Fallback to a placeholder if image fails to load
                          e.currentTarget.src = `https://api.dicebear.com/6.x/identicon/svg?seed=${player.id}&backgroundColor=b6e3f4`;
                        }}
                      />
                    </span>
                    <span className="player-name">{player.name}</span>
                    <button
                      type="button"
                      className="remove-player"
                      onClick={() => handleRemovePlayerFromTeam('team2', player.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {team2Players.length < 2 && availablePlayers.length > 0 && (
                  <select
                    className="player-select"
                    value=""
                    onChange={(e) => {
                      const player = players.find(p => p.id === e.target.value);
                      if (player) handleAddPlayerToTeam('team2', player);
                      e.target.value = '';
                    }}
                  >
                    <option value="">Add player...</option>
                    {availablePlayers.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {errors.team2Players && (
                <span className="error-message">{errors.team2Players}</span>
              )}
            </div>
          </div>

          {/* Score Input */}
          <div className={`scores-section ${errors.scores ? 'error' : ''}`}>
            <h3 className="scores-title">Scores</h3>
            <div className="scores-inputs">
              <div className="score-input">
                <label className="score-label">Team 1 Score</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  className="form-input score-number"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="score-separator">-</div>
              <div className="score-input">
                <label className="score-label">Team 2 Score</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  className="form-input score-number"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            {errors.scores && (
              <span className="error-message">{errors.scores}</span>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {type === 'create' ? 'Create Match' : 'Update Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchModal;
