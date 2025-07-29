# Release Workflow Setup

This document explains how to configure the release workflow to work with branch protection rules and repository rulesets.

## Issue

The release workflow may fail with an error like "not being allowed to tag main" when trying to create releases. This happens when:

1. The main branch has protection rules enabled
2. Repository rulesets prevent direct pushes to main
3. The default `GITHUB_TOKEN` doesn't have sufficient permissions to bypass these protections

## Solution

To fix this issue, you need to create a Personal Access Token (PAT) with the necessary permissions:

### Step 1: Create a Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Configure the token:
   - **Name**: `Release Workflow Token`
   - **Expiration**: Choose appropriate expiration (90 days or custom)
   - **Resource owner**: Select your username or organization
   - **Selected repositories**: Choose this repository
   - **Permissions**:
     - Repository permissions:
       - Contents: Write
       - Metadata: Read
       - Pull requests: Write (if using PR-based releases)

### Step 2: Add the Token as a Repository Secret

1. Go to your repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `PAT_TOKEN`
4. Value: Paste the token you created in Step 1
5. Click "Add secret"

### Step 3: Configure Repository Rulesets (Alternative)

If you prefer not to use a PAT, you can configure repository rulesets to allow the GitHub Actions bot to bypass restrictions:

1. Go to Settings → Rules → Rulesets
2. Edit the ruleset that's blocking the release
3. Add bypass permissions for:
   - GitHub Actions (`github-actions[bot]`)
   - Or the specific workflow/action that needs access

## Verification

After setting up the PAT token:

1. The release workflow will automatically use `PAT_TOKEN` if available
2. If `PAT_TOKEN` is not set, it falls back to `GITHUB_TOKEN`
3. Run a test release to verify everything works

## Troubleshooting

- **Error: "refused to update checked out branch"**: Make sure the token has sufficient permissions
- **Error: "protected branch hook declined"**: The token needs to bypass branch protection
- **Error: "authentication failed"**: Verify the PAT token is correctly set in repository secrets

## Security Notes

- Use fine-grained PATs instead of classic tokens when possible
- Set appropriate expiration dates for tokens
- Only grant the minimum required permissions
- Regularly rotate tokens according to your security policy