# Dependabot Configuration

This repository uses GitHub Dependabot to automatically keep dependencies up to date.

## Ecosystems Monitored

- **Docker**: Base images in `Dockerfile` (weekly updates)
- **npm**: JavaScript/TypeScript dependencies in `package.json` (weekly updates)
- **GitHub Actions**: Workflow dependencies in `.github/workflows/` (weekly updates)

## Manual Update Checks

You can manually trigger dependabot updates in several ways:

### Via GitHub UI
1. Go to the **Security** tab in the repository
2. Click on **Dependabot** in the left sidebar
3. Click the **Check for updates** button for any ecosystem

### Via Dependabot Commands
In any dependabot PR, you can comment with:
- `@dependabot rebase` - Rebase the PR
- `@dependabot recreate` - Recreate the PR from scratch
- `@dependabot merge` - Merge the PR (if checks pass)
- `@dependabot squash and merge` - Squash and merge the PR
- `@dependabot cancel merge` - Cancel an auto-merge
- `@dependabot reopen` - Reopen a closed PR
- `@dependabot close` - Close the PR
- `@dependabot ignore this [patch|minor|major] version` - Ignore this version

## Configuration Features

### Dependency Grouping
Dependencies are automatically grouped into logical sets:
- **TypeScript/ESLint**: All TypeScript and linting tools
- **Dev Dependencies**: Development and build tools
- **Server Dependencies**: Runtime server dependencies

### Smart Scheduling
- Updates run every Monday at 6:00 AM UTC
- Maximum 10 npm PRs, 5 Docker PRs, 5 GitHub Actions PRs
- Automatic rebasing when conflicts occur

### PR Management
- All PRs are automatically assigned to @commjoen for review
- Clear commit message prefixes (`deps:`, `docker:`, `ci:`)
- Automatic labeling for easy filtering
- Organized branch naming convention

## Security Updates

Security vulnerabilities are included in the regular weekly updates and will be processed with higher priority when detected.
