const API_BASE = (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, '');

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new Error(
      'Missing REACT_APP_API_URL. Deploy the backend (see backend/template.yaml) and set this in .env or Netlify environment variables.'
    );
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>)
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// Player service — calls Lambda HTTP API (credentials stay on AWS).
export const playerService = {
  getAllPlayers: () => apiRequest<unknown[]>('/players'),

  getPlayer: (id: string) =>
    apiRequest<Record<string, unknown> | null>(`/players/${encodeURIComponent(id)}`),

  createPlayer: (playerData: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>('/players', {
      method: 'POST',
      body: JSON.stringify(playerData)
    }),

  updatePlayer: (id: string, playerData: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/players/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(playerData)
    }),

  deletePlayer: (id: string) =>
    apiRequest<{ id: string }>(`/players/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
};

export const matchService = {
  getAllMatches: () => apiRequest<unknown[]>('/matches'),

  getMatch: (id: string) =>
    apiRequest<Record<string, unknown> | null>(`/matches/${encodeURIComponent(id)}`),

  createMatch: (matchData: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData)
    }),

  updateMatch: (id: string, matchData: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/matches/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(matchData)
    }),

  deleteMatch: (id: string) =>
    apiRequest<{ id: string }>(`/matches/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
};

export function convertToDynamoDBFormat(data: unknown): Record<string, unknown> {
  const converted = { ...(data as Record<string, unknown>) };

  if (converted.createdAt instanceof Date) {
    converted.createdAt = converted.createdAt.toISOString();
  }
  if (converted.date instanceof Date) {
    converted.date = converted.date.toISOString();
  }

  return converted;
};

export function convertFromDynamoDBFormat<T>(data: unknown): T {
  const converted = { ...(data as Record<string, unknown>) };

  if (converted.createdAt) {
    converted.createdAt = new Date(converted.createdAt as string);
  }
  if (converted.date) {
    converted.date = new Date(converted.date as string);
  }

  converted.rankingAdjustmentTotal = converted.rankingAdjustmentTotal ?? 0;
  converted.rankingBonusTotal = converted.rankingBonusTotal ?? 0;

  return converted as T;
}
