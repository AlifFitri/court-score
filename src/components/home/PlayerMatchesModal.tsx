import React, { useEffect } from 'react';
import type { Match, Player } from '../../types';
import type { PlayerMatchLedgerEntry } from '../../utils/ranking';
import { formatDate } from '../../utils';
import './PlayerMatchesModal.css';

interface PlayerMatchesModalProps {
  isOpen: boolean;
  player: Player | null;
  entries: PlayerMatchLedgerEntry[];
  onClose: () => void;
}

/** Short label like "vs Kim & Morgan" — partner names omitted for ledger row player */
const summarizeOpposingTeamPlayers = (
  match: Match,
  playerTeam: 1 | 2,
  selfId: string
): string => {
  const opp = playerTeam === 1 ? match.team2.players : match.team1.players;
  const names = opp
    .filter((p) => p.id !== selfId)
    .map((p) => p.name)
    .filter(Boolean);
  if (names.length === 0) return '(opponent)';
  return names.join(' & ');
};

/** Mean dense ranks — decimals only when fractional (typical doubles) */
const formatTeamAvgRank = (v: number): string => {
  if (!Number.isFinite(v)) return '—';
  const r = Math.round(v);
  if (Math.abs(v - r) < 1e-6) return String(r);
  return v.toFixed(1);
};

const PlayerMatchesModal: React.FC<PlayerMatchesModalProps> = ({
  isOpen,
  player,
  entries,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !player) return null;

  return (
    <div className="player-matches-overlay" role="presentation" onClick={onClose}>
      <div
        className="player-matches-dialog"
        role="dialog"
        aria-labelledby="player-matches-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="player-matches-header">
          <h2 id="player-matches-title">Matches — {player.name}</h2>
          <button type="button" className="player-matches-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <p className="player-matches-caption">
          Uses the same standings as upset math: dense ties share a rank. <strong>You</strong> show your ordinal;
          each <strong>team</strong> shows the average of teammates’ ordinals before that match — Team 1 (left scores)
          vs Team 2 (right). Your squad is emphasized.
        </p>
        <div className="player-matches-body">
          {entries.length === 0 ? (
            <p className="player-matches-empty">No counted matches yet.</p>
          ) : (
            <ul className="player-matches-list">
              {entries.map((row) => {
                const up = row.pointDelta >= 0;
                return (
                  <li key={row.matchId} className="player-matches-card">
                    <div className="player-matches-row-meta">
                      <span
                        className="player-matches-prerank"
                        title="Your dense ordinal among all roster players before this match (ties share one number)."
                      >
                        You: #{row.rankBeforeMatch}
                      </span>
                      <span className="player-matches-team-ranks" aria-label="Team average ranks before match">
                        <span
                          className={`player-matches-team-rank ${
                            row.playerTeamSide === 1 ? 'player-matches-team-rank-highlight' : ''
                          }`}
                          title="Mean team rank — Team 1 (left)"
                        >
                          Team 1 avg: {formatTeamAvgRank(row.team1AvgRankBefore)}
                        </span>
                        <span className="player-matches-team-rank-sep" aria-hidden="true">
                          ·
                        </span>
                        <span
                          className={`player-matches-team-rank ${
                            row.playerTeamSide === 2 ? 'player-matches-team-rank-highlight' : ''
                          }`}
                          title="Mean team rank — Team 2 (right)"
                        >
                          Team 2 avg: {formatTeamAvgRank(row.team2AvgRankBefore)}
                        </span>
                      </span>
                    </div>
                    <div className="player-matches-row-top">
                      <time className="player-matches-date" dateTime={row.date.toISOString()}>
                        {formatDate(row.date)}
                      </time>
                      <span
                        className={
                          row.isWin
                            ? 'player-matches-result player-matches-win'
                            : 'player-matches-result player-matches-loss'
                        }
                      >
                        {row.isWin ? 'Win' : 'Loss'}
                      </span>
                      <span
                        className={
                          up
                            ? 'player-matches-points player-matches-points-pos'
                            : 'player-matches-points player-matches-points-neg'
                        }
                      >
                        {row.pointDelta > 0 ? `+${row.pointDelta}` : row.pointDelta}
                      </span>
                    </div>
                    <div className="player-matches-opponents">
                      vs {summarizeOpposingTeamPlayers(row.matchSnapshot, row.playerTeamSide, player.id)}
                    </div>
                    <div className="player-matches-score-line">
                      {row.matchSnapshot.team1.players.map((p) => p.name).join(' & ')} ({row.matchSnapshot.team1.score}) —
                      ({row.matchSnapshot.team2.score}) {row.matchSnapshot.team2.players.map((p) => p.name).join(' & ')}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerMatchesModal;
