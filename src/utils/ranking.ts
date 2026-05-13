import type { Match, Player } from '../types';

/** Base divisor term in the leaderboard average (included in numerator). */
export const BASE_RANKING_POINTS = 100;

/** Players need this many recorded matches for the main leaderboard. */
export const RANKED_MATCH_THRESHOLD = 3;

const BASE_WIN = 3;
const BASE_LOSS = -1;

export interface RankingTotals {
  matches: number;
  wins: number;
  losses: number;
  /** Sum per match of base (+3 / -1) plus upset modifiers */
  adjustmentTotal: number;
  /** Net upset-only modifier (bonus for winner, −same for loser); does not include base win/loss */
  bonusTotal: number;
}

export interface PlayerRankingSnapshot extends RankingTotals {
  /** Points column: 100 + sum of net changes from every counted match */
  cumulativePoints: number;
  /** Table ordering matches upset logic: 100 + (adjustmentSum ÷ matches) */
  sortScore: number;
}

/** Ordering key for leaderboard rows and ordinal ranks — rewards higher per-match net gain */
export function leaderboardMomentumScore(matches: number, adjustmentTotal: number): number {
  if (matches <= 0) return 0;
  return BASE_RANKING_POINTS + adjustmentTotal / matches;
}

/** What users sum in match history modals: 100 + Σ per-match deltas */
export function leaderboardCumulativePoints(matches: number, adjustmentTotal: number): number {
  if (matches <= 0) return 0;
  return BASE_RANKING_POINTS + adjustmentTotal;
}

const sortMatchesChronologically = (matches: Match[]): Match[] =>
  [...matches].sort((a, b) => {
    const t = a.date.getTime() - b.date.getTime();
    if (t !== 0) return t;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

/** Compare match times — newest first (tie-break createdAt DESC). */
export function compareMatchesDescending(a: Match, b: Match): number {
  const td = b.date.getTime() - a.date.getTime();
  if (td !== 0) return td;
  return b.createdAt.getTime() - a.createdAt.getTime();
}

/** Newest-first copy for Matches page and similar UI. Ranking replay still sorts oldest-first internally. */
export function sortMatchesDescendingForDisplay(matches: Match[]): Match[] {
  return [...matches].sort(compareMatchesDescending);
}

const emptyTotals = (): RankingTotals => ({
  matches: 0,
  wins: 0,
  losses: 0,
  adjustmentTotal: 0,
  bonusTotal: 0,
});

/** Upset tier from rank gap when the worse-ranked player/team wins. */
const upsetTierFromGap = (gapRounded: number): 0 | 1 | 2 => {
  if (gapRounded < 1) return 0;
  if (gapRounded <= 2) return 1;
  return 2;
};

/** True when two records should share the same ordinal rank / upset tier (dense ties). */
const standingsTiedForSameRank = (a: RankingTotals, b: RankingTotals): boolean => {
  if (a.matches <= 0 && b.matches <= 0) return true;
  if (a.matches <= 0 || b.matches <= 0) return false;
  return a.adjustmentTotal * b.matches === b.adjustmentTotal * a.matches;
};

/** Leaderboard cohort rows: same cumulative points ⇒ same printed rank */
const snapshotsTiedForDisplayRank = (a: PlayerRankingSnapshot, b: PlayerRankingSnapshot): boolean => {
  if (a.matches <= 0 && b.matches <= 0) return true;
  return a.cumulativePoints === b.cumulativePoints;
};

const sortStandingsDescending = (
  scoring: ({ id: string } & RankingTotals & { computedScoreForSort: number })[]
) => {
  scoring.sort((a, b) => {
    const sc = b.computedScoreForSort - a.computedScoreForSort;
    if (sc !== 0) return sc;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.matches !== a.matches) return b.matches - a.matches;
    if (a.matches <= 0 && b.matches <= 0) return a.id.localeCompare(b.id);
    if (b.losses !== a.losses) return a.losses - b.losses;
    return a.id.localeCompare(b.id);
  });
};

/** Dense rank — everyone with identical standing shares the same rank number. */
const assignDenseOrdinalRanks = (
  scoring: ({ id: string } & RankingTotals & { computedScoreForSort: number })[]
): Map<string, number> => {
  const ordinal = new Map<string, number>();
  if (scoring.length === 0) return ordinal;
  let rank = 1;
  ordinal.set(scoring[0].id, rank);
  for (let i = 1; i < scoring.length; i++) {
    const cur = scoring[i];
    const prev = scoring[i - 1];
    if (!standingsTiedForSameRank(cur, prev)) {
      rank += 1;
    }
    ordinal.set(cur.id, rank);
  }
  return ordinal;
};

const ordinalRanksBeforeMatch = (
  allPlayerIds: string[],
  beforeMap: Map<string, RankingTotals>
): Map<string, number> => {
  const scoring = allPlayerIds.map((id) => {
    const t = beforeMap.get(id) ?? emptyTotals();
    const computedScoreForSort =
      t.matches > 0 ? leaderboardMomentumScore(t.matches, t.adjustmentTotal) : Number.NEGATIVE_INFINITY;
    return {
      id,
      computedScoreForSort,
      matches: t.matches,
      wins: t.wins,
      losses: t.losses,
      adjustmentTotal: t.adjustmentTotal,
      bonusTotal: t.bonusTotal,
    };
  });

  sortStandingsDescending(scoring);

  return assignDenseOrdinalRanks(scoring);
};

const averageOrdinalRank = (playerIds: string[], ordinals: Map<string, number>): number => {
  const vals = playerIds.map((pid) => ordinals.get(pid) ?? Infinity);
  if (vals.length === 0) return Infinity;
  return vals.reduce((a, v) => a + v, 0) / vals.length;
};

/** Sort key appended for “new match” previews so simultaneous DB rows lex before the pending synthetic. */
const PENDING_SYNTHETIC_SORT_ID = '\uffff\uffff\uffff__pending-match__';

/** Matches strictly earlier than cutoff tuple (time, tie-break id), optionally skipping ids */
const matchesStrictlyBefore = (
  matches: Match[],
  cutoff: { date: Date; createdAt: Date; sortId: string },
  excludeIds?: Set<string>
): Match[] => {
  const cTime = cutoff.date.getTime();
  const cCreated = cutoff.createdAt.getTime();
  return matches.filter((m) => {
    if (excludeIds?.has(m.id)) return false;
    const mTime = m.date.getTime();
    if (mTime < cTime) return true;
    if (mTime > cTime) return false;
    if (m.createdAt.getTime() < cCreated) return true;
    if (m.createdAt.getTime() > cCreated) return false;
    return m.id.localeCompare(cutoff.sortId) < 0;
  });
};

const getUpsetBonusesFromAverages = (winnerAvgRankBefore: number, loserAvgRankBefore: number) => {
  let bonusWinner = 0;
  let bonusLoser = 0;
  if (winnerAvgRankBefore > loserAvgRankBefore) {
    const gap = Math.round(winnerAvgRankBefore - loserAvgRankBefore);
    const upsetTier = upsetTierFromGap(gap);
    if (upsetTier === 1) {
      bonusWinner = 1;
      bonusLoser = -1;
    } else if (upsetTier === 2) {
      bonusWinner = 2;
      bonusLoser = -2;
    }
  }
  return { bonusWinner, bonusLoser };
};

const applyMatchToTotals = (
  winnerIds: string[],
  loserIds: string[],
  winnerAvgRankBefore: number,
  loserAvgRankBefore: number,
  map: Map<string, RankingTotals>
) => {
  const { bonusWinner, bonusLoser } = getUpsetBonusesFromAverages(winnerAvgRankBefore, loserAvgRankBefore);

  winnerIds.forEach((id) => {
    let t = map.get(id);
    if (!t) {
      t = emptyTotals();
      map.set(id, t);
    }
    t.matches += 1;
    t.wins += 1;
    t.adjustmentTotal += BASE_WIN + bonusWinner;
    t.bonusTotal += bonusWinner;
  });

  loserIds.forEach((id) => {
    let t = map.get(id);
    if (!t) {
      t = emptyTotals();
      map.set(id, t);
    }
    t.matches += 1;
    t.losses += 1;
    t.adjustmentTotal += BASE_LOSS + bonusLoser;
    t.bonusTotal += bonusLoser;
  });
};

/** Replay ordered matches into per-player aggregates (deterministic rankings before each step). */
export const replayRankingFromMatches = (
  roster: Player[],
  matchesInput: Match[]
): Map<string, RankingTotals> => {
  const rosterIds = new Set(roster.map((p) => p.id));
  const totals = new Map<string, RankingTotals>();
  roster.forEach((p) => totals.set(p.id, emptyTotals()));

  const ordered = sortMatchesChronologically(matchesInput);

  for (const match of ordered) {
    applyRecordedMatchTotals(match, totals, roster, rosterIds);
  }

  return totals;
};

/** Per-match ledger row for leaderboard history modal */
export interface PlayerMatchLedgerEntry {
  matchId: string;
  date: Date;
  /** Dense ordinal standing (everyone ties share same rank) before this match and before points apply */
  rankBeforeMatch: number;
  /** Mean dense rank of Team 1 (left score column) roster players — upset logic */
  team1AvgRankBefore: number;
  /** Mean dense rank of Team 2 (right score column) roster players */
  team2AvgRankBefore: number;
  isWin: boolean;
  /** Net ranking adjustment (+3/−1 and upset tiers) counted for this match */
  pointDelta: number;
  playerTeamSide: 1 | 2;
  matchSnapshot: Match;
}

function applyRecordedMatchTotals(
  match: Match,
  totals: Map<string, RankingTotals>,
  roster: Player[],
  rosterIds: Set<string>
): void {
  const t1Players = match.team1.players ?? [];
  const t2Players = match.team2.players ?? [];
  const team1Ids = t1Players.map((p) => p.id).filter((id) => rosterIds.has(id));
  const team2Ids = t2Players.map((p) => p.id).filter((id) => rosterIds.has(id));
  const allIdsInMatch = Array.from(new Set(team1Ids.concat(team2Ids)));

  const w = winnerFromScores(match.team1.score, match.team2.score);
  if (!w || allIdsInMatch.length === 0) return;

  const allParticipantIds =
    roster.length > 0
      ? roster.map((p) => p.id)
      : Array.from(new Set(Array.from(rosterIds).concat(team1Ids).concat(team2Ids)));

  const ordinals = ordinalRanksBeforeMatch(allParticipantIds, totals);
  const winnerIds = w === 'team1' ? team1Ids : team2Ids;
  const loserIds = w === 'team1' ? team2Ids : team1Ids;
  const winnerAvg = averageOrdinalRank(winnerIds, ordinals);
  const loserAvg = averageOrdinalRank(loserIds, ordinals);

  applyMatchToTotals(winnerIds, loserIds, winnerAvg, loserAvg, totals);
}

/** Chronological list of matches affecting `playerId` with deltas matching full replay semantics */
export function buildPlayerMatchLedger(
  roster: Player[],
  matchesInput: Match[],
  playerId: string
): PlayerMatchLedgerEntry[] {
  const rosterIds = new Set(roster.map((p) => p.id));
  if (!rosterIds.has(playerId)) return [];

  const totals = new Map<string, RankingTotals>();
  roster.forEach((p) => totals.set(p.id, emptyTotals()));

  const ledger: PlayerMatchLedgerEntry[] = [];
  const ordered = sortMatchesChronologically(matchesInput);

  for (const match of ordered) {
    const t1Players = match.team1.players ?? [];
    const t2Players = match.team2.players ?? [];
    const team1Ids = t1Players.map((p) => p.id).filter((id) => rosterIds.has(id));
    const team2Ids = t2Players.map((p) => p.id).filter((id) => rosterIds.has(id));
    const allIdsInMatch = Array.from(new Set(team1Ids.concat(team2Ids)));

    const onTeam1 = team1Ids.includes(playerId);
    const onTeam2 = team2Ids.includes(playerId);
    if (!(onTeam1 || onTeam2)) {
      applyRecordedMatchTotals(match, totals, roster, rosterIds);
      continue;
    }

    const w = winnerFromScores(match.team1.score, match.team2.score);
    if (!w || allIdsInMatch.length === 0) {
      continue;
    }

    const allParticipantIds =
      roster.length > 0
        ? roster.map((p) => p.id)
        : Array.from(new Set(Array.from(rosterIds).concat(team1Ids).concat(team2Ids)));

    const ordinals = ordinalRanksBeforeMatch(allParticipantIds, totals);
    const winnerIds = w === 'team1' ? team1Ids : team2Ids;
    const loserIds = w === 'team1' ? team2Ids : team1Ids;
    const winnerAvg = averageOrdinalRank(winnerIds, ordinals);
    const loserAvg = averageOrdinalRank(loserIds, ordinals);

    const team1AvgRankBefore = averageOrdinalRank(team1Ids, ordinals);
    const team2AvgRankBefore = averageOrdinalRank(team2Ids, ordinals);

    const { bonusWinner, bonusLoser } = getUpsetBonusesFromAverages(winnerAvg, loserAvg);
    const isWin = winnerIds.includes(playerId);
    const pointDelta = isWin ? BASE_WIN + bonusWinner : BASE_LOSS + bonusLoser;

    const rankBeforeMatch = ordinals.get(playerId) ?? 1;

    ledger.push({
      matchId: match.id,
      date: match.date,
      rankBeforeMatch,
      team1AvgRankBefore,
      team2AvgRankBefore,
      isWin,
      pointDelta,
      playerTeamSide: onTeam1 ? 1 : 2,
      matchSnapshot: match,
    });

    applyMatchToTotals(winnerIds, loserIds, winnerAvg, loserAvg, totals);
  }

  return ledger.sort((a, b) => compareMatchesDescending(a.matchSnapshot, b.matchSnapshot));
}

/** Singles/doubles previews and replay — team1 wins if score is greater */
export function winnerFromScores(score1: number, score2: number): 'team1' | 'team2' | null {
  if (score1 > score2) return 'team1';
  if (score2 > score1) return 'team2';
  return null;
}

/** Merge DynamoDB Player rows with aggregates from match replay */
export function playersWithRankingFromMatches(players: Player[], matches: Match[]): Player[] {
  const aggregates = replayRankingFromMatches(players, matches);
  return players.map((p) => {
    const agg = aggregates.get(p.id) ?? emptyTotals();
    return {
      ...p,
      matches: agg.matches,
      wins: agg.wins,
      losses: agg.losses,
      rankingAdjustmentTotal: agg.adjustmentTotal,
      rankingBonusTotal: agg.bonusTotal,
    };
  });
}

export interface PlayerRankingRow {
  player: Player;
  /** Position within ranked or provisional cohort (1-based) */
  cohortRank: number;
  provisional: boolean;
  snapshot: PlayerRankingSnapshot;
}

export function buildLeaderboardRows(players: Player[], matches: Match[]): PlayerRankingRow[] {
  const aggregates = replayRankingFromMatches(players, matches);

  const synced = players.map((p) => {
    const agg = aggregates.get(p.id) ?? emptyTotals();
    return {
      ...p,
      matches: agg.matches,
      wins: agg.wins,
      losses: agg.losses,
      rankingAdjustmentTotal: agg.adjustmentTotal,
      rankingBonusTotal: agg.bonusTotal,
    };
  });

  const rows: PlayerRankingRow[] = synced.map((p) => {
    const agg = aggregates.get(p.id) ?? emptyTotals();
    const cumulativePoints =
      agg.matches > 0 ? leaderboardCumulativePoints(agg.matches, agg.adjustmentTotal) : 0;
    const sortScore =
      agg.matches > 0 ? leaderboardMomentumScore(agg.matches, agg.adjustmentTotal) : 0;
    return {
      player: p,
      cohortRank: 0,
      provisional: agg.matches < RANKED_MATCH_THRESHOLD,
      snapshot: { ...agg, cumulativePoints, sortScore },
    };
  });

  const comparator = (a: PlayerRankingRow, b: PlayerRankingRow): number => {
    if (b.snapshot.sortScore !== a.snapshot.sortScore) {
      return b.snapshot.sortScore - a.snapshot.sortScore;
    }
    if (b.snapshot.wins !== a.snapshot.wins) return b.snapshot.wins - a.snapshot.wins;
    if (b.snapshot.losses !== a.snapshot.losses) return a.snapshot.losses - b.snapshot.losses;
    return a.player.name.localeCompare(b.player.name);
  };

  const ranked = rows.filter((r) => !r.provisional).sort(comparator);
  ranked.forEach((r, i) => {
    if (i === 0) r.cohortRank = 1;
    else if (snapshotsTiedForDisplayRank(r.snapshot, ranked[i - 1].snapshot))
      r.cohortRank = ranked[i - 1].cohortRank;
    else r.cohortRank = ranked[i - 1].cohortRank + 1;
  });

  const provisional = rows.filter((r) => r.provisional).sort(comparator);
  provisional.forEach((r, i) => {
    if (i === 0) r.cohortRank = 1;
    else if (snapshotsTiedForDisplayRank(r.snapshot, provisional[i - 1].snapshot))
      r.cohortRank = provisional[i - 1].cohortRank;
    else r.cohortRank = provisional[i - 1].cohortRank + 1;
  });

  return [...ranked, ...provisional];
}

export function formatLeaderboardPoints(cumulativePoints: number, matches: number): string {
  if (matches <= 0) return '—';
  return cumulativePoints.toFixed(0);
}

export interface MatchPointsPreviewParticipant {
  playerId: string;
  name?: string;
  delta: number;
  /** upset-only component of delta */
  bonusDelta: number;
}

export interface MatchPointsPreviewResult {
  team1Totals: MatchPointsPreviewParticipant[];
  team2Totals: MatchPointsPreviewParticipant[];
  /** True if ranks could not be computed (missing players, draw, invalid teams) */
  incomplete: boolean;
}

/**
 * Point changes if this match is applied next chronologically relative to existing `matchesExclude`.
 */
export function previewMatchPoints(
  roster: Player[],
  existingMatchesOrdered: Match[],
  pending: {
    date: Date;
    createdAtFallback: Date;
    team1Players: Pick<Player, 'id' | 'name'>[];
    team2Players: Pick<Player, 'id' | 'name'>[];
    team1Score: number;
    team2Score: number;
    /** Omit when creating; exclude this id from replay baseline when editing */
    excludeMatchId?: string;
  }
): MatchPointsPreviewResult {
  const pool = pending.excludeMatchId
    ? existingMatchesOrdered.filter((m) => m.id !== pending.excludeMatchId)
    : existingMatchesOrdered;

  const sortId =
    pending.excludeMatchId !== undefined ? pending.excludeMatchId : PENDING_SYNTHETIC_SORT_ID;

  const baselineMatches = matchesStrictlyBefore(pool, {
    date: pending.date,
    createdAt: pending.createdAtFallback,
    sortId,
  });

  const beforeMap = replayRankingFromMatches(roster, baselineMatches);

  const w = winnerFromScores(pending.team1Score, pending.team2Score);
  const team1Ids = pending.team1Players.map((p) => p.id);
  const team2Ids = pending.team2Players.map((p) => p.id);

  if (
    !w ||
    team1Ids.length === 0 ||
    team2Ids.length === 0 ||
    new Set(team1Ids.concat(team2Ids)).size !== team1Ids.length + team2Ids.length
  ) {
    return {
      team1Totals: [],
      team2Totals: [],
      incomplete: true,
    };
  }

  const allParticipantIds = roster.length > 0 ? roster.map((p) => p.id) : Array.from(new Set(team1Ids.concat(team2Ids)));

  const ordinals = ordinalRanksBeforeMatch(allParticipantIds, beforeMap);

  const winnerIds = w === 'team1' ? team1Ids : team2Ids;
  const loserIds = w === 'team1' ? team2Ids : team1Ids;

  const winnerAvg = averageOrdinalRank(winnerIds, ordinals);
  const loserAvg = averageOrdinalRank(loserIds, ordinals);

  let bonusWinner = 0;
  let bonusLoser = 0;

  if (winnerAvg > loserAvg) {
    const gap = Math.round(winnerAvg - loserAvg);
    const tier = upsetTierFromGap(gap);
    if (tier === 1) {
      bonusWinner = 1;
      bonusLoser = -1;
    } else if (tier === 2) {
      bonusWinner = 2;
      bonusLoser = -2;
    }
  }

  const buildParticipants = (
    ids: string[],
    isWinner: boolean
  ): MatchPointsPreviewParticipant[] =>
    ids.map((pid) => {
      const pl = roster.find((x) => x.id === pid);
      const nm =
        pl?.name ??
        pending.team1Players.find((tp) => tp.id === pid)?.name ??
        pending.team2Players.find((tp) => tp.id === pid)?.name;
      return {
        playerId: pid,
        name: nm,
        delta: isWinner ? BASE_WIN + bonusWinner : BASE_LOSS + bonusLoser,
        bonusDelta: isWinner ? bonusWinner : bonusLoser,
      };
    });

  return {
    team1Totals: buildParticipants(team1Ids, w === 'team1'),
    team2Totals: buildParticipants(team2Ids, w === 'team2'),
    incomplete: false,
  };
}
