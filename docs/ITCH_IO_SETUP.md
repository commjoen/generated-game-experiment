# itch.io Integration Setup Guide

This guide explains how to set up automatic deployment to itch.io for your game project.

## Prerequisites

1. **itch.io account**: You need an active itch.io developer account
2. **Game page**: Create your game page on itch.io (can be in draft mode)
3. **GitHub repository**: This integration uses GitHub Actions

## Setup Steps

### 1. Create Game Page on itch.io

1. Go to https://itch.io/game/new
2. Fill in your game details:
   - **Title**: Generated Game Experiment (or your preferred name)
   - **Short description**: A browser-based side-scrolling platformer
   - **Classification**: Game
   - **Kind of project**: HTML
3. Note your game's URL format: `https://[username].itch.io/[game-slug]`

### 2. Get itch.io API Key

1. Go to https://itch.io/user/settings/api-keys
2. Click "Generate new API key"
3. Give it a name like "GitHub Actions Deploy"
4. Copy the generated key (you won't be able to see it again)

### 3. Configure GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions:

1. **BUTLER_API_KEY** (Required)
   - Click "New repository secret"
   - Name: `BUTLER_API_KEY`
   - Value: The API key from step 2

2. **ITCH_USER** (Optional)
   - Name: `ITCH_USER`
   - Value: Your itch.io username
   - Default: `commjoen`

3. **ITCH_GAME** (Optional)
   - Name: `ITCH_GAME`
   - Value: Your game's slug (the part after the last `/` in the URL)
   - Default: `generated-game-experiment`

### 4. Test the Integration

#### Automatic Deployment
1. Create a new release in your GitHub repository
2. The itch.io deployment will trigger automatically
3. Check the Actions tab to see the deployment progress

#### Manual Deployment
1. Go to Actions → Deploy to itch.io
2. Click "Run workflow"
3. Enter a tag name (e.g., `v0.4.0`)
4. Click "Run workflow"

## How It Works

The integration uses itch.io's `butler` CLI tool to upload your game:

1. **Trigger**: Runs on release publication or manual dispatch
2. **Build**: Creates a production build using `npm run build`
3. **Package**: Copies build output to itch.io package format
4. **Upload**: Uses butler to push to the `html` channel
5. **Version**: Sets the version to match your GitHub release tag

## Troubleshooting

### Common Issues

1. **"BUTLER_API_KEY secret not found"**
   - Make sure you've added the API key as a repository secret
   - Check the secret name is exactly `BUTLER_API_KEY`

2. **"No index.html found in build output"**
   - Ensure `npm run build` produces a `dist/index.html` file
   - Check your build configuration

3. **"Authentication failed"**
   - Verify your API key is correct and hasn't expired
   - Generate a new API key if needed

4. **"Game not found"**
   - Check your `ITCH_USER` and `ITCH_GAME` settings
   - Ensure the game page exists on itch.io
   - Verify the URL format: `https://[ITCH_USER].itch.io/[ITCH_GAME]`

### Workflow Logs

Check the GitHub Actions logs for detailed information:
1. Go to your repository → Actions
2. Click on the "Deploy to itch.io" workflow run
3. Click on the "deploy-to-itch" job
4. Expand each step to see detailed logs

## Advanced Configuration

### Custom Game Settings

You can customize the deployment by setting these secrets:

```
ITCH_USER=your-username
ITCH_GAME=your-game-slug
```

### Multiple Games

To deploy to multiple games, you can:
1. Create separate workflows for each game
2. Use different secret names for each game
3. Modify the workflow to use different channels

### Pre-release Versions

The workflow automatically deploys all releases. To deploy only stable releases:
1. Edit `.github/workflows/itch-io-deploy.yml`
2. Change the trigger to exclude pre-releases:
   ```yaml
   on:
     release:
       types: [published]
       # Remove this line to include pre-releases: types: [published, prereleased]
   ```

## Security Notes

- API keys are stored securely as GitHub secrets
- Keys are only accessible to authorized workflow runs
- Butler CLI is downloaded fresh for each deployment
- No credentials are logged or cached

## Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Verify your itch.io game page settings
3. Test your API key manually using butler CLI
4. Review itch.io's documentation: https://itch.io/docs/butler/