import React, { useState, useEffect } from 'react';
import { Player, CreatePlayerData } from '../../types';
import { defaultAvatars } from '../../utils';
import './PlayerModal.css';

// Props for the PlayerModal component
interface PlayerModalProps {
  isOpen: boolean;
  type: 'create' | 'edit' | 'delete';
  player: Player | null;
  onSave: (playerData: CreatePlayerData) => void;
  onClose: () => void;
}

// Player modal component for creating/editing players
const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  type,
  player,
  onSave,
  onClose
}) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Initialize form when modal opens or player changes
  useEffect(() => {
    if (isOpen) {
      if (type === 'edit' && player) {
        setName(player.name);
        setSelectedAvatar(player.avatar);
      } else {
        setName('');
        setSelectedAvatar(defaultAvatars[0]);
      }
      setErrors({});
    }
  }, [isOpen, type, player]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Player name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Player name must be at least 2 characters';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Player name must be less than 50 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        name: name.trim(),
        avatar: selectedAvatar
      });
    }
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content player-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {type === 'create' ? 'Create New Player' : 'Edit Player'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="player-form">
          {/* Name Input */}
          <div className="form-group">
            <label htmlFor="playerName" className="form-label">
              Player Name *
            </label>
            <input
              type="text"
              id="playerName"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter player name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Avatar Selection */}
          <div className="form-group">
            <label className="form-label">
              Select Avatar
            </label>
            <div className="avatar-grid">
              {defaultAvatars.map((avatar, index) => (
                <div
                  key={index}
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  <img 
                    src={avatar} 
                    alt={`Avatar ${index + 1}`} 
                    className="avatar-image"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      e.currentTarget.src = `https://api.dicebear.com/6.x/identicon/svg?seed=${index}&backgroundColor=b6e3f4`;
                    }}
                  />
                </div>
              ))}
            </div>
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
              {type === 'create' ? 'Create Player' : 'Update Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerModal;
