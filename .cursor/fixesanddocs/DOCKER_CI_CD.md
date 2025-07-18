# Docker CI/CD & Container Releases

Automated Docker container builds and releases for the multiplayer platformer game using GitHub Actions.

## 🚀 Quick Overview

- **✅ Automatic builds** on every PR and main branch push
- **🐳 Multi-platform** support (amd64, arm64)
- **📦 GitHub Container Registry** (ghcr.io) - always enabled
- **🌐 Docker Hub** support (optional, requires secrets)
- **🔒 Security scanning** with Trivy vulnerability scanner
- **🧪 Automated testing** of built containers

## 📋 Workflows

### 1. Docker Build and Release (`.github/workflows/docker-release.yml`)

**Triggers:**
- ✅ Pull requests to `main` branch
- ✅ Pushes to `main` branch  
- ✅ GitHub releases

**What it does:**
- Builds multi-platform Docker images
- Publishes to GitHub Container Registry (ghcr.io)
- Tests the built containers
- Comments on PRs with build results
- Runs security scans

**Output Images:**
```bash
# For PRs
ghcr.io/username/repo-name:pr-123

# For main branch
ghcr.io/username/repo-name:latest
ghcr.io/username/repo-name:main

# For releases
ghcr.io/username/repo-name:v1.0.0
ghcr.io/username/repo-name:1.0
ghcr.io/username/repo-name:1
```

### 2. Docker Hub Release (`.github/workflows/docker-hub-release.yml`)

**Triggers:**
- ✅ GitHub releases
- ✅ Manual workflow dispatch

**Requirements:**
- `DOCKERHUB_USERNAME` secret
- `DOCKERHUB_TOKEN` secret

**What it does:**
- Builds and pushes to Docker Hub
- Updates repository description
- Creates release tags

**Output Images:**
```bash
# For releases
username/platformer-game:latest
username/platformer-game:v1.0.0
username/platformer-game:1.0
username/platformer-game:1
```

## 🔧 Setup Instructions

### GitHub Container Registry (Automatic)

No setup required! Works automatically with GitHub permissions.

### Docker Hub (Optional)

1. **Create Docker Hub Token:**
   - Go to [Docker Hub](https://hub.docker.com) → Settings → Security
   - Create new access token with Read/Write permissions

2. **Add GitHub Secrets:**
   ```
   Repository Settings → Secrets and Variables → Actions
   
   DOCKERHUB_USERNAME=your-dockerhub-username
   DOCKERHUB_TOKEN=your-access-token
   ```

3. **Enable Workflow:**
   - Docker Hub workflow will automatically run on releases
   - Or trigger manually from Actions tab

## 🎯 Image Tags & Versions

### GitHub Container Registry (ghcr.io)

| Event | Tag Examples | Description |
|-------|-------------|-------------|
| PR #123 | `pr-123` | PR-specific builds |
| Main branch | `latest`, `main` | Latest stable build |
| Release v1.2.3 | `v1.2.3`, `1.2`, `1` | Semantic versioning |
| Commit abc123 | `main-abc123` | Commit-specific builds |

### Docker Hub

| Event | Tag Examples | Description |
|-------|-------------|-------------|
| Release v1.2.3 | `latest`, `v1.2.3`, `1.2`, `1` | Semantic versioning |
| Manual trigger | `latest` | Manual builds |

## 🧪 Automated Testing

Each build includes automated tests:

```bash
# Container functionality tests
✅ Game client loads on port 80
✅ Multiplayer server starts on port 3001  
✅ Health checks respond correctly
✅ Container starts and stops cleanly
```

## 🔒 Security Scanning

**Trivy Security Scanner:**
- Scans all built images for vulnerabilities
- Results uploaded to GitHub Security tab
- Fails build on critical vulnerabilities (configurable)

**View Results:**
```
Repository → Security → Code scanning alerts
```

## 📦 Using Released Images

### GitHub Container Registry

```bash
# Latest from main branch
docker pull ghcr.io/username/repo-name:latest
docker run -p 8080:80 -p 3001:3001 ghcr.io/username/repo-name:latest

# Specific PR build
docker pull ghcr.io/username/repo-name:pr-123
docker run -p 8080:80 -p 3001:3001 ghcr.io/username/repo-name:pr-123

# Specific release
docker pull ghcr.io/username/repo-name:v1.0.0
docker run -p 8080:80 -p 3001:3001 ghcr.io/username/repo-name:v1.0.0
```

### Docker Hub

```bash
# Latest release
docker pull username/platformer-game:latest
docker run -p 8080:80 -p 3001:3001 username/platformer-game:latest

# Specific version
docker pull username/platformer-game:v1.0.0
docker run -p 8080:80 -p 3001:3001 username/platformer-game:v1.0.0
```

## 🎮 PR Testing Workflow

When you create a PR:

1. **Automatic Build** triggers on PR creation/update
2. **Multi-platform Build** (amd64, arm64) 
3. **Container Testing** runs automatically
4. **PR Comment** added with build results:

```markdown
## 🐳 Docker Image Built Successfully!

**Image:** `ghcr.io/username/repo:pr-123`

### 🚀 Quick Test
```bash
docker pull ghcr.io/username/repo:pr-123
docker run -p 8080:80 -p 3001:3001 ghcr.io/username/repo:pr-123
```

### 📋 Features Tested
- ✅ Game client loads on port 80
- ✅ Multiplayer server starts on port 3001
- ✅ Health checks pass
- ✅ Multi-platform build (amd64, arm64)
```

## 🌐 Deploy PR Images

### To Render.com

Update your Render service to use the PR image:

```yaml
# In Render dashboard, update image reference:
ghcr.io/username/repo-name:pr-123
```

### To Any Docker Environment

```bash
# Pull and test PR changes
docker pull ghcr.io/username/repo-name:pr-123
docker run -p 8080:80 -p 3001:3001 ghcr.io/username/repo-name:pr-123

# Access at http://localhost:8080
```

## 📊 Build Optimization

### Multi-Stage Builds
```dockerfile
# Optimized for size and security
Stage 1: Build game client (Node.js)
Stage 2: Setup multiplayer server deps
Stage 3: Final nginx + Node.js (Alpine)
```

### Caching Strategy
```yaml
# GitHub Actions cache for faster builds
cache-from: type=gha
cache-to: type=gha,mode=max
```

### Build Context
```yaml
# Only triggers on relevant file changes
paths:
  - 'src/**'
  - 'server.js'
  - 'Dockerfile'
  - 'package.json'
  # ... other relevant files
```

## 🔧 Troubleshooting

### Build Failures

**Check build logs:**
```
Actions tab → Failed workflow → Build job → Logs
```

**Common issues:**
- Dockerfile syntax errors
- Missing dependencies
- Network timeouts during build

**Local testing:**
```bash
# Test build locally first
docker build -t test-image .
docker run -p 8080:80 -p 3001:3001 test-image
```

### Registry Issues

**GitHub Container Registry:**
- Automatic with GITHUB_TOKEN
- No additional setup required
- Check repository permissions

**Docker Hub:**
- Verify DOCKERHUB_USERNAME secret
- Verify DOCKERHUB_TOKEN secret  
- Check token permissions (Read/Write)

### Security Scan Failures

**View scan results:**
```
Security tab → Code scanning alerts → Trivy
```

**Fix vulnerabilities:**
- Update base images in Dockerfile
- Update package dependencies
- Review security recommendations

## 🚀 Release Process

### Creating a Release

1. **Tag your release:**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. **Create GitHub Release:**
   - Go to Releases → Create new release
   - Select your tag
   - Add release notes
   - Publish release

3. **Automatic Builds:**
   - GitHub Container Registry build starts automatically
   - Docker Hub build starts (if configured)
   - Images tagged with version numbers

### Deployment Options

**Render.com:**
```yaml
# Update render.yaml or service settings
image: ghcr.io/username/repo-name:v1.0.0
```

**Docker Compose:**
```yaml
services:
  game:
    image: ghcr.io/username/repo-name:v1.0.0
    ports:
      - "8080:80"
      - "3001:3001"
```

**Kubernetes:**
```yaml
spec:
  containers:
  - name: platformer-game
    image: ghcr.io/username/repo-name:v1.0.0
    ports:
    - containerPort: 80
    - containerPort: 3001
```

## 📈 Monitoring & Analytics

### GitHub Insights

```
Insights → Actions → Workflow runs
- Build success rates
- Build duration trends
- Resource usage
```

### Container Registry

**GitHub Packages:**
```
Packages tab → Container details
- Download statistics
- Version history
- Vulnerability reports
```

**Docker Hub:**
```
Repository → Insights
- Pull statistics
- Geographic distribution
- Version popularity
```

## 🎯 Best Practices

### Version Management
- Use semantic versioning (v1.2.3)
- Tag releases consistently
- Include changelog in releases

### Security
- Regular dependency updates
- Monitor vulnerability scans
- Use minimal base images

### Performance
- Optimize Dockerfile layers
- Use build caching effectively
- Monitor build times

### Testing
- Test images before release
- Include health checks
- Verify multiplayer functionality

Your Docker CI/CD pipeline is now ready to automatically build, test, and release your multiplayer platformer game! 🎮🐳