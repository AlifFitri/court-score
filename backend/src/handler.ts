import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PLAYERS_TABLE = process.env.PLAYERS_TABLE ?? '';
const MATCHES_TABLE = process.env.MATCHES_TABLE ?? '';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'content-type': 'application/json'
};

function json(statusCode: number, body: unknown, extraHeaders: Record<string, string> = {}): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { ...corsHeaders, ...extraHeaders },
    body: body === undefined || body === null ? '' : JSON.stringify(body)
  };
}

function parseSegments(path: string): string[] {
  return path.replace(/^\/?/, '').split('/').filter(Boolean);
}

function decodedBody(event: APIGatewayProxyEventV2): string | undefined {
  if (!event.body) return undefined;
  if (event.isBase64Encoded) {
    return Buffer.from(event.body, 'base64').toString('utf8');
  }
  return event.body;
}

async function dispatch(
  segments: string[],
  method: string,
  rawBody: string | undefined | null
): Promise<APIGatewayProxyResultV2> {
  const body = (): Record<string, unknown> => {
    try {
      return rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    } catch {
      throw new SyntaxError('Invalid JSON body');
    }
  };

  const resource = segments[0];
  const id = segments[1];

  if (!resource || (resource !== 'players' && resource !== 'matches')) {
    return json(404, { error: 'Not found' });
  }

  const table = resource === 'players' ? PLAYERS_TABLE : MATCHES_TABLE;
  if (!table) {
    return json(500, { error: 'Table configuration missing' });
  }

  if (resource === 'players') {
    if (method === 'GET' && !id) {
      const r = await doc.send(new ScanCommand({ TableName: table }));
      return json(200, r.Items ?? []);
    }
    if (method === 'GET' && id) {
      const r = await doc.send(new GetCommand({ TableName: table, Key: { id } }));
      return json(200, r.Item ?? null);
    }
    if (method === 'POST' && !id) {
      const item = body() as Record<string, unknown>;
      await doc.send(new PutCommand({ TableName: table, Item: item }));
      return json(201, item);
    }
    if (method === 'PUT' && id) {
      const playerData = body() as Record<string, unknown>;
      const adj =
        typeof playerData.rankingAdjustmentTotal === 'number' ? playerData.rankingAdjustmentTotal : 0;
      const bon = typeof playerData.rankingBonusTotal === 'number' ? playerData.rankingBonusTotal : 0;
      const r = await doc.send(
        new UpdateCommand({
          TableName: table,
          Key: { id },
          UpdateExpression:
            'SET #name = :name, avatar = :avatar, matches = :matches, wins = :wins, losses = :losses, rankingAdjustmentTotal = :radj, rankingBonusTotal = :rbon',
          ExpressionAttributeNames: { '#name': 'name' },
          ExpressionAttributeValues: {
            ':name': playerData.name,
            ':avatar': playerData.avatar,
            ':matches': playerData.matches,
            ':wins': playerData.wins,
            ':losses': playerData.losses,
            ':radj': adj,
            ':rbon': bon
          },
          ReturnValues: 'ALL_NEW'
        })
      );
      return json(200, r.Attributes);
    }
    if (method === 'DELETE' && id) {
      await doc.send(new DeleteCommand({ TableName: table, Key: { id } }));
      return json(200, { id });
    }
  }

  if (resource === 'matches') {
    if (method === 'GET' && !id) {
      const r = await doc.send(new ScanCommand({ TableName: table }));
      return json(200, r.Items ?? []);
    }
    if (method === 'GET' && id) {
      const r = await doc.send(new GetCommand({ TableName: table, Key: { id } }));
      return json(200, r.Item ?? null);
    }
    if (method === 'POST' && !id) {
      const item = body() as Record<string, unknown>;
      await doc.send(new PutCommand({ TableName: table, Item: item }));
      return json(201, item);
    }
    if (method === 'PUT' && id) {
      const matchData = body() as Record<string, unknown>;
      const r = await doc.send(
        new UpdateCommand({
          TableName: table,
          Key: { id },
          UpdateExpression: 'SET #date = :date, team1 = :team1, team2 = :team2',
          ExpressionAttributeNames: { '#date': 'date' },
          ExpressionAttributeValues: {
            ':date': matchData.date,
            ':team1': matchData.team1,
            ':team2': matchData.team2
          },
          ReturnValues: 'ALL_NEW'
        })
      );
      return json(200, r.Attributes);
    }
    if (method === 'DELETE' && id) {
      await doc.send(new DeleteCommand({ TableName: table, Key: { id } }));
      return json(200, { id });
    }
  }

  return json(405, { error: 'Method not allowed' });
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext.http.method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  const path = event.rawPath ?? '/';
  const segments = parseSegments(path);

  try {
    return await dispatch(segments, event.requestContext.http.method, decodedBody(event));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    const status = message === 'Invalid JSON body' ? 400 : 500;
    return json(status, { error: message });
  }
}
