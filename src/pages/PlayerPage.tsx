import React, { useState } from 'react';
import { Player, CreatePlayerData, ModalState } from '../types';
import { generateId } from '../utils';
import PlayerModal from '../components/players/PlayerModal';
import './PlayerPage.css';

// Mock data for initial development
const initialPlayers: Player[] = [
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
  }
];

// Player page component for managing players
const PlayerPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'create'
  });
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter players based on search term
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open create player modal
  const handleCreatePlayer = () => {
    setSelectedPlayer(null);
    setModalState({ isOpen: true, type: 'create' });
  };

  // Open edit player modal
  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setModalState({ isOpen: true, type: 'edit', data: player });
  };

  // Handle delete player
  const handleDeletePlayer = (playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      setPlayers(players.filter(player => player.id !== playerId));
    }
  };

  // Handle save player (create or update)
  const handleSavePlayer = (playerData: CreatePlayerData) => {
    if (modalState.type === 'create') {
      // Create new player
      const newPlayer: Player = {
        id: generateId(),
        ...playerData,
        matches: 0,
        wins: 0,
        losses: 0,
        createdAt: new Date()
      };
      setPlayers([...players, newPlayer]);
    } else if (modalState.type === 'edit' && selectedPlayer) {
      // Update existing player
      setPlayers(players.map(player =>
        player.id === selectedPlayer.id
          ? { ...player, ...playerData }
          : player
      ));
    }
    setModalState({ ...modalState, isOpen: false });
  };

  // Close modal
  const handleCloseModal = () => {
    setModalState({ ...modalState, isOpen: false });
    setSelectedPlayer(null);
  };

  // Calculate player statistics
  const getPlayerStats = (player: Player) => {
    const winPercentage = player.matches > 0 ? (player.wins / player.matches * 100) : 0;
    return {
      winPercentage: winPercentage.toFixed(1),
      matches: player.matches,
      wins: player.wins,
      losses: player.losses
    };
  };

  return (
    <div className="player-page">
      <div className="page-header">
        <h1>Players</h1>
        <p>Manage players and their profiles</p>
      </div>

      <div className="player-actions">
        <button
          className="btn btn-primary"
          onClick={handleCreatePlayer}
        >
          + Create Player
        </button>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search players..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredPlayers.length === 0 ? (
        <div className="empty-state">
          <h3>No Players Found</h3>
          <p>
            {searchTerm 
              ? 'No players match your search criteria'
              : 'Get started by creating your first player'
            }
          </p>
          {!searchTerm && (
            <button
              className="btn btn-primary mt-2"
              onClick={handleCreatePlayer}
            >
              Create First Player
            </button>
          )}
        </div>
      ) : (
        <div className="players-grid">
          {filteredPlayers.map((player) => {
            const stats = getPlayerStats(player);
            return (
              <div key={player.id} className="player-card">
                <div className="player-header">
                  <div className="player-avatar-large">
                    {player.avatar}
                  </div>
                  <div className="player-info">
                    <h3 className="player-name">{player.name}</h3>
                    <p className="player-joined">
                      Joined {player.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="player-stats">
                  <div className="stat">
                    <span className="stat-value">{stats.matches}</span>
                    <span className="stat-label">Matches</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value win">{stats.wins}</span>
                    <span className="stat-label">Wins</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value loss">{stats.losses}</span>
                    <span className="stat-label">Losses</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value percentage">{stats.winPercentage}%</span>
                    <span className="stat-label">Win Rate</span>
                  </div>
                </div>

                <div className="player-actions">
                  <button
                    className="btn btn-outline btn-small"
                    onClick={() => handleEditPlayer(player)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline btn-small"
                    onClick={() => handleDeletePlayer(player.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Player Modal */}
      <PlayerModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        player={selectedPlayer}
        onSave={handleSavePlayer}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PlayerPage;
