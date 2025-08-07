# PR Preview Deployments

## Overview

Every pull request now gets its own preview deployment on GitHub Pages, allowing reviewers to test changes before they're merged.

## How It Works

### Automatic Deployment

- When a PR is opened, updated, or reopened, the `pr-preview.yml` workflow triggers
- The game is built with a PR-specific base path: `/generated-game-experiment/pr-{number}/`
- The build is deployed to GitHub Pages at that specific path
- A comment is automatically added to the PR with the preview URL

### Preview URLs

- Format: `https://commjoen.github.io/generated-game-experiment/pr-{number}/`
- Example: `https://commjoen.github.io/generated-game-experiment/pr-42/`

### Automatic Cleanup

- When a PR is closed or merged, the `pr-cleanup.yml` workflow triggers
- The PR-specific directory is removed from the `gh-pages` branch
- A cleanup comment is posted to the PR confirming removal

## Workflows

### `.github/workflows/pr-preview.yml`

- **Triggers**: Pull request opened, synchronize, reopened
- **Permissions**: contents:read, pages:write, id-token:write, pull-requests:write
- **Steps**:
  1. Checkout code with full git history
  2. Setup Node.js and install dependencies
  3. Build with PR-specific base path
  4. Deploy to GitHub Pages subdirectory
  5. Comment on PR with preview URL

### `.github/workflows/pr-cleanup.yml`

- **Triggers**: Pull request closed
- **Permissions**: contents:write, pages:write, id-token:write, pull-requests:write
- **Steps**:
  1. Checkout gh-pages branch
  2. Remove PR directory if it exists
  3. Commit and push cleanup
  4. Comment on PR about cleanup

## Configuration

The workflows use the existing Vite configuration with `VITE_BASE_PATH` environment variable:

- Main deployment: `VITE_BASE_PATH=/generated-game-experiment/`
- PR deployments: `VITE_BASE_PATH=/generated-game-experiment/pr-{number}/`

## Benefits

- **Review Experience**: Reviewers can test changes without setting up local environment
- **Visual Changes**: UI/UX changes can be tested directly in browser
- **Multiplayer Testing**: Multiple reviewers can test multiplayer features together
- **Mobile Testing**: Mobile-specific changes can be tested on actual devices
- **Automated**: No manual intervention required
- **Clean**: Automatic cleanup prevents accumulation of old deployments

## Limitations

- GitHub Pages has usage limits for free accounts
- Preview deployments use production build (not dev server)
- Network features depend on main server deployment
- Preview URLs are public (consider for sensitive changes)

## Maintenance

- Workflows should be monitored for failures
- GitHub Pages storage usage should be checked periodically
- Failed cleanups might need manual intervention in rare cases

## Security Considerations

- PR previews deploy untrusted code from forks
- Consider restricting to trusted contributors if needed
- Review changes carefully before merging
- Preview URLs are public and discoverable
