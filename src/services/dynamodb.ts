import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION || 'ap-southeast-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Table names from environment variables
const PLAYERS_TABLE = process.env.REACT_APP_DYNAMODB_PLAYERS_TABLE || 'court-score-players';
const MATCHES_TABLE = process.env.REACT_APP_DYNAMODB_MATCHES_TABLE || 'court-score-matches';

// Player service functions
export const playerService = {
  // Get all players
  getAllPlayers: async () => {
    const params = {
      TableName: PLAYERS_TABLE
    };

    try {
      const result = await dynamoDB.scan(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  },

  // Get player by ID
  getPlayer: async (id: string) => {
    const params = {
      TableName: PLAYERS_TABLE,
      Key: { id }
    };

    try {
      const result = await dynamoDB.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('Error fetching player:', error);
      throw error;
    }
  },

  // Create new player
  createPlayer: async (playerData: any) => {
    const params = {
      TableName: PLAYERS_TABLE,
      Item: playerData
    };

    try {
      await dynamoDB.put(params).promise();
      return playerData;
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  },

  // Update player
  updatePlayer: async (id: string, playerData: any) => {
    const params = {
      TableName: PLAYERS_TABLE,
      Key: { id },
      UpdateExpression: 'SET #name = :name, avatar = :avatar, matches = :matches, wins = :wins, losses = :losses',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': playerData.name,
        ':avatar': playerData.avatar,
        ':matches': playerData.matches,
        ':wins': playerData.wins,
        ':losses': playerData.losses
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamoDB.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  },

  // Delete player
  deletePlayer: async (id: string) => {
    const params = {
      TableName: PLAYERS_TABLE,
      Key: { id }
    };

    try {
      await dynamoDB.delete(params).promise();
      return { id };
    } catch (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  }
};

// Match service functions
export const matchService = {
  // Get all matches
  getAllMatches: async () => {
    const params = {
      TableName: MATCHES_TABLE
    };

    try {
      const result = await dynamoDB.scan(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },

  // Get match by ID
  getMatch: async (id: string) => {
    const params = {
      TableName: MATCHES_TABLE,
      Key: { id }
    };

    try {
      const result = await dynamoDB.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('Error fetching match:', error);
      throw error;
    }
  },

  // Create new match
  createMatch: async (matchData: any) => {
    const params = {
      TableName: MATCHES_TABLE,
      Item: matchData
    };

    try {
      await dynamoDB.put(params).promise();
      return matchData;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  },

  // Update match
  updateMatch: async (id: string, matchData: any) => {
    const params = {
      TableName: MATCHES_TABLE,
      Key: { id },
      UpdateExpression: 'SET #date = :date, team1 = :team1, team2 = :team2',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':date': matchData.date,
        ':team1': matchData.team1,
        ':team2': matchData.team2
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamoDB.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  },

  // Delete match
  deleteMatch: async (id: string) => {
    const params = {
      TableName: MATCHES_TABLE,
      Key: { id }
    };

    try {
      await dynamoDB.delete(params).promise();
      return { id };
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  }
};

// Helper function to convert date objects for DynamoDB
export const convertToDynamoDBFormat = (data: any) => {
  const converted = { ...data };
  
  // Convert Date objects to ISO strings for DynamoDB
  if (converted.createdAt instanceof Date) {
    converted.createdAt = converted.createdAt.toISOString();
  }
  if (converted.date instanceof Date) {
    converted.date = converted.date.toISOString();
  }
  
  return converted;
};

// Helper function to convert from DynamoDB format
export const convertFromDynamoDBFormat = (data: any) => {
  const converted = { ...data };
  
  // Convert ISO strings back to Date objects
  if (converted.createdAt) {
    converted.createdAt = new Date(converted.createdAt);
  }
  if (converted.date) {
    converted.date = new Date(converted.date);
  }
  
  return converted;
};
