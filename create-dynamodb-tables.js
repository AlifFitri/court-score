const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envVars = envFile.split('\n');
    
    envVars.forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        
        // Set environment variable if it doesn't exist
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

// Load environment variables from .env file
loadEnv();

// Configure AWS SDK - use the same credentials as your React app
// Force the use of environment variables by not calling AWS.config.update()
// and instead creating a new AWS.DynamoDB instance with explicit credentials
const awsConfig = {
  region: process.env.REACT_APP_AWS_REGION || 'ap-southeast-1'
};

// Only set credentials if they exist in environment variables
if (process.env.REACT_APP_AWS_ACCESS_KEY_ID && process.env.REACT_APP_AWS_SECRET_ACCESS_KEY) {
  awsConfig.accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
  awsConfig.secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
}

console.log('Using AWS configuration:');
console.log(`- Region: ${awsConfig.region}`);
console.log(`- Access Key ID: ${awsConfig.accessKeyId ? '***' + awsConfig.accessKeyId.slice(-4) : 'Not set (using default AWS credentials)'}`);

const dynamoDB = new AWS.DynamoDB(awsConfig);

const PLAYERS_TABLE = process.env.REACT_APP_DYNAMODB_PLAYERS_TABLE || 'court-score-players';
const MATCHES_TABLE = process.env.REACT_APP_DYNAMODB_MATCHES_TABLE || 'court-score-matches';

async function createTables() {
  try {
    // Create Players table
    const playersTableParams = {
      TableName: PLAYERS_TABLE,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }  // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    // Create Matches table
    const matchesTableParams = {
      TableName: MATCHES_TABLE,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }  // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    console.log('Creating DynamoDB tables...');
    
    // Create Players table
    try {
      await dynamoDB.createTable(playersTableParams).promise();
      console.log(`✅ Created table: ${PLAYERS_TABLE}`);
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log(`ℹ️ Table ${PLAYERS_TABLE} already exists`);
      } else {
        throw error;
      }
    }

    // Create Matches table
    try {
      await dynamoDB.createTable(matchesTableParams).promise();
      console.log(`✅ Created table: ${MATCHES_TABLE}`);
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log(`ℹ️ Table ${MATCHES_TABLE} already exists`);
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All tables created successfully!');
    console.log(`Players table: ${PLAYERS_TABLE}`);
    console.log(`Matches table: ${MATCHES_TABLE}`);
    console.log('\nYou can now use the application with DynamoDB!');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure your AWS credentials are correct in the .env file');
    console.log('2. Ensure your IAM user has DynamoDB permissions');
    console.log('3. Check that the AWS region is correct');
  }
}

createTables();
