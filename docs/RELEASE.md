# Release Workflow Guide

This document explains how to use the release workflow to create tagged releases of the Generated Game Experiment.

## 🚀 How to Create a Release

The release workflow can only be triggered manually by authorized repository maintainers (primarily @commjoen).

### Steps to Create a Release

1. **Navigate to Actions**
   - Go to the [Actions tab](https://github.com/commjoen/generated-game-experiment/actions)
   - Select "Create Release" workflow

2. **Trigger the Workflow**
   - Click "Run workflow"
   - Choose your options:
     - **Version bump type**: `patch`, `minor`, or `major`
     - **Custom version** (optional): Override automatic calculation
     - **Pre-release**: Mark as pre-release if needed

3. **Version Bump Guide**
   - **Patch** (e.g., 0.2.1 → 0.2.2): Bug fixes, small improvements
   - **Minor** (e.g., 0.2.1 → 0.3.0): New features, backwards compatible
   - **Major** (e.g., 0.2.1 → 1.0.0): Breaking changes, major rewrites

## ✨ What the Workflow Does

1. **Validation**
   - Runs all tests to ensure code quality
   - Builds the project to verify everything works

2. **Version Management**
   - Calculates the new version based on your selection
   - Updates `package.json` with the new version
   - Commits the version change

3. **Release Creation**
   - Creates a semantic version Git tag (e.g., `v0.2.2`)
   - Generates release notes automatically
   - Creates a GitHub Release with the notes

4. **Automation Triggers**
   - Existing Docker workflows will automatically build and publish images
   - Docker Hub release (if configured) will be triggered

## 📋 Release Notes

Release notes are generated automatically and include:
- **First Release**: Feature overview and deployment information
- **Subsequent Releases**: List of commits since the last tag
- **Technical Details**: Version, build info, and commit hash

## 🔒 Security & Access

- Only repository maintainers can trigger this workflow
- Requires `workflow_dispatch` permissions
- All changes are committed with the official GitHub Actions bot

## 🐳 Docker Images

After a successful release, Docker images will be available at:
- **GitHub Container Registry**: `ghcr.io/commjoen/generated-game-experiment:v<version>`
- **Docker Hub** (if configured): `<username>/platformer-game:v<version>`

## 🎮 Deployment

Released versions are automatically deployed to:
- **GitHub Pages**: [commjoen.github.io/generated-game-experiment](https://commjoen.github.io/generated-game-experiment/)
- **Render**: [generated-game-experiment.onrender.com](https://generated-game-experiment.onrender.com/)

## 📝 Example Usage

```bash
# Run the latest release
docker pull ghcr.io/commjoen/generated-game-experiment:latest
docker run -p 8080:80 -p 3001:3001 ghcr.io/commjoen/generated-game-experiment:latest

# Run a specific version
docker pull ghcr.io/commjoen/generated-game-experiment:v0.2.2
docker run -p 8080:80 -p 3001:3001 ghcr.io/commjoen/generated-game-experiment:v0.2.2
```

## 🛠️ Troubleshooting

If the workflow fails:
1. Check the workflow logs for specific error messages
2. Ensure all tests are passing on the main branch
3. Verify the version format is correct (if using custom version)
4. Contact @commjoen for repository-specific issues