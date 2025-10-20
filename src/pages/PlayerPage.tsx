import React, { useState, useEffect } from 'react';
import { Player, CreatePlayerData, ModalState } from '../types';
import { generateId } from '../utils';
import PlayerModal from '../components/players/PlayerModal';
import { playerService, convertToDynamoDBFormat, convertFromDynamoDBFormat } from '../services/dynamodb';
import './PlayerPage.css';

// Player page component for managing players
const PlayerPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'create'
  });
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load players from DynamoDB on component mount
  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoading(true);
      try {
        const playersData = await playerService.getAllPlayers();
        const convertedPlayers = playersData.map(convertFromDynamoDBFormat);
        setPlayers(convertedPlayers);
      } catch (error) {
        console.error('Error loading players:', error);
        // Set empty players on error
        setPlayers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayers();
  }, []);

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
  const handleDeletePlayer = async (playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await playerService.deletePlayer(playerId);
        setPlayers(players.filter(player => player.id !== playerId));
      } catch (error) {
        console.error('Error deleting player:', error);
        alert('Failed to delete player. Please try again.');
      }
    }
  };

  // Handle save player (create or update)
  const handleSavePlayer = async (playerData: CreatePlayerData) => {
    try {
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
        
        // Save to DynamoDB
        const playerForDB = convertToDynamoDBFormat(newPlayer);
        await playerService.createPlayer(playerForDB);
        
        // Update local state
        setPlayers([...players, newPlayer]);
      } else if (modalState.type === 'edit' && selectedPlayer) {
        // Update existing player
        const updatedPlayer = { 
          ...selectedPlayer, 
          ...playerData 
        };
        
        // Save to DynamoDB
        const playerForDB = convertToDynamoDBFormat(updatedPlayer);
        await playerService.updatePlayer(selectedPlayer.id, playerForDB);
        
        // Update local state
        setPlayers(players.map(player =>
          player.id === selectedPlayer.id
            ? updatedPlayer
            : player
        ));
      }
      setModalState({ ...modalState, isOpen: false });
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Failed to save player. Please try again.');
    }
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
      <div className="player-page-header">
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

      {isLoading ? (
        <div className="loading">Loading players...</div>
      ) : filteredPlayers.length === 0 ? (
        <div className="player-empty-state">
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
                <div className="player-card-header">
                  <div className="player-card-avatar">
                    <img 
                      src={player.avatar} 
                      alt={`${player.name} avatar`}
                      className="avatar-image"
                      onError={(e) => {
                        // Fallback to a placeholder if image fails to load
                        e.currentTarget.src = `https://api.dicebear.com/6.x/identicon/svg?seed=${player.id}&backgroundColor=b6e3f4`;
                      }}
                    />
                  </div>
                  <div className="player-card-info">
                    <h3 className="player-card-name">{player.name}</h3>
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

                <div className="player-card-actions">
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
