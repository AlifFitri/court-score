# Court Score - Badminton League Management

A React TypeScript application for managing badminton league players, matches, and rankings with AWS DynamoDB integration.

## Features

- **Player Management**: Create, edit, delete players with avatar support
- **Match Management**: Record matches with team assignments and scores
- **Player Rankings**: Automatic ranking based on win percentage
- **DynamoDB Integration**: All data persisted in AWS DynamoDB
- **Responsive Design**: Works on desktop and mobile devices

## AWS DynamoDB Setup

### Important: DynamoDB Tables Must Be Created First

**No, DynamoDB tables are NOT automatically created** when users add players/matches. You must create the tables manually before using the application.

### How DynamoDB Columns Work

**DynamoDB is schema-less** - columns (attributes) are automatically created when you add data. You only need to define:
- **Table names** (we use `court-score-players` and `court-score-matches`)
- **Primary key** (we use `id` as the partition key)

All other columns (name, avatar, matches, wins, losses, date, team1, team2, etc.) are automatically created when you save data. No need to predefine them!

### Step-by-Step Setup

1. **Update Environment Variables**
   - Copy `.env` and update with your AWS credentials:
   ```bash
   # AWS DynamoDB Configuration
   REACT_APP_AWS_ACCESS_KEY_ID=your_actual_access_key_here
   REACT_APP_AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here
   REACT_APP_AWS_REGION=ap-southeast-1
   REACT_APP_DYNAMODB_PLAYERS_TABLE=court-score-players
   REACT_APP_DYNAMODB_MATCHES_TABLE=court-score-matches
   ```

2. **Create DynamoDB Tables**
   ```bash
   # Run the table creation script
   node create-dynamodb-tables.js
   ```

3. **Verify IAM Permissions**
   Ensure your AWS IAM user has these DynamoDB permissions:
   - `dynamodb:CreateTable`
   - `dynamodb:PutItem`
   - `dynamodb:GetItem`
   - `dynamodb:UpdateItem`
   - `dynamodb:DeleteItem`
   - `dynamodb:Scan`
   - `dynamodb:Query`

### Troubleshooting

If you see errors like "Table not found" or "Access denied":
- Verify your AWS credentials in `.env`
- Run the table creation script again
- Check IAM permissions in AWS Console
- Ensure the AWS region matches your DynamoDB tables

## Available Scripts

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
