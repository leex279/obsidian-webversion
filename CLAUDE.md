# Obsidian Remote - Project Primer

## Project Overview

**obsidian-remote** is a Docker containerization project that enables [Obsidian.md](https://obsidian.md/) to run in a browser-accessible environment.

- **Purpose**: Provide remote access to Obsidian note-taking application via web browser
- **Type**: Docker container infrastructure project
- **Current Version**: Obsidian 1.8.10
- **Accessibility**: HTTP (8080) and HTTPS (8443) web interface
- **Target Users**: Users needing remote/headless Obsidian access

## Architecture

### Container Architecture
- **Base Image**: `ghcr.io/linuxserver/baseimage-kasmvnc:debianbookworm`
  - Provides KasmVNC for browser-based desktop access
  - Debian Bookworm base with pre-configured VNC environment

- **Application Layer**: Obsidian AppImage
  - Extracted and run directly from AppImage format
  - Supports both amd64 and arm64 architectures
  - Run with security flags: `--no-sandbox --disable-gpu --disable-dev-shm-usage`

### Directory Structure
```
obsidian-remote/
├── Dockerfile              # Multi-arch container definition
├── README.md              # Comprehensive usage documentation
├── root/                  # Container filesystem overlay
│   ├── defaults/          # Default configurations
│   │   ├── autostart     # Obsidian startup script
│   │   ├── menu.xml      # Openbox window manager config
│   │   └── startwm.sh    # Window manager startup
│   └── etc/
│       └── cont-init.d/   # Container initialization scripts
│           ├── 50-config  # Main configuration script
│           └── 56-openboxcopy  # Openbox setup
├── .github/
│   └── workflows/
│       ├── docker-publish.yml  # Multi-arch build & publish
│       └── docker.yml          # Legacy workflow
└── assets/                # Documentation images
```

### Key Architectural Patterns
- **LinuxServer.io Ecosystem**: Leverages LSIO base images and mods system
- **Container Init System**: Uses s6-overlay for process supervision
- **Volume Mapping**: Separates user data (/vaults) from config (/config)
- **Multi-arch Support**: Automated builds for amd64 and arm64

## Tech Stack

### Core Technologies
- **Container Runtime**: Docker
- **Base OS**: Debian Bookworm
- **VNC Server**: KasmVNC (web-based VNC)
- **Window Manager**: Openbox
- **Application**: Obsidian (Electron-based)

### Build & Deployment
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (GHCR) & Docker Hub
- **Build System**: Docker Buildx (multi-platform)
- **Image Tags**: Semantic versioning via git tags

### Runtime Dependencies
- **Required Packages**:
  - `libnss3`, `zlib1g-dev` - SSL/compression support
  - `dbus-x11`, `uuid-runtime` - Desktop environment
  - `libfuse2` - AppImage support
  - `libatk1.0-0`, `libatk-bridge2.0-0` - Accessibility
  - `libcups2`, `libgtk-3-0` - Desktop integration

### Optional Extensions (via DOCKER_MODS)
- **Git Support**: `linuxserver/mods:universal-git` (for obsidian-git plugin)
- **Custom Packages**: `linuxserver/mods:universal-package-install`
- **Language Packs**: `fonts-noto-cjk`, `fonts-noto-extra` for CJK support

## Environment Configuration

### Critical Environment Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `PUID/PGID` | 911/911 | Container user/group IDs |
| `TZ` | Etc/UTC | Timezone configuration |
| `CUSTOM_PORT` | 8080 | HTTP port |
| `CUSTOM_HTTPS_PORT` | 8443 | HTTPS port |
| `PASSWORD` | (empty) | Optional HTTP basic auth |
| `DOCKER_MODS` | - | Add LinuxServer mods |
| `KEYBOARD` | - | Keyboard layout (e.g., en-us-qwerty) |

### Volume Mounts
- **/vaults**: Obsidian vault storage (user notes)
- **/config**: Obsidian config + SSH data for git integration

## Core Principles

### Code Organization
- **Minimal footprint**: Only essential packages installed
- **Security-first**: No GPU/sandbox for reduced attack surface
- **User ownership**: All files chowned to container user (abc:abc)
- **Stateless container**: All persistent data in volumes

### Container Init Flow (50-config)
1. Set password if `PASSWORD` env var provided
2. Create /vaults directory if missing
3. Configure timezone from `TZ` variable
4. Set ownership of /config, /vaults, /root to abc:abc

### Application Startup (autostart)
- Runs Obsidian with flags: `--no-sandbox --no-xshm --disable-dev-shm-usage --disable-gpu --disable-software-rasterizer`
- Launched via sudo as container user

### Documentation Standards
- **Comprehensive README**: Covers all use cases
- **Platform-specific examples**: Windows PowerShell & Linux bash
- **Security warnings**: Explicit warnings about exposing to web
- **Community contributions**: Examples from users (fonts, NPM setup)

## Current State

### Active Development
- **Branch**: main
- **Recent Focus**: ARM64 support, Obsidian version updates
- **Latest Version**: Obsidian 1.8.10

### Recent Changes (Last 5 Commits)
1. `f9b3206` - ARM64 support + bump to Obsidian 1.8.10
2. `e2ac4ad` - Update README for arm64 image tag
3. `36e9149` - README updates
4. `0b8857f` - Bug fixes (#85, #110, #115)
5. `4a5c9d7` - Update docker.yml workflow

### Uncommitted Changes
- Modified: Multiple config files (.dockerignore, Dockerfile, README, etc.)
- Untracked: `.claude/` directory (project documentation)
- Status: Working on documentation/configuration updates

### Multi-Platform Support
- **AMD64**: Published to `ghcr.io/sytone/obsidian-remote:latest`
- **ARM64**: Published to `sytone/obsidian-remote:arm64` (Docker Hub)
- **Build Platform**: Both architectures built via GitHub Actions

## Key Implementation Details

### Dockerfile Build Process
1. Install system dependencies
2. Download Obsidian AppImage (version-specific, arch-aware)
3. Extract AppImage contents to /squashfs-root
4. Set environment variables
5. Copy root/ overlay files
6. Configure healthcheck (curl to localhost with optional auth)

### Healthcheck
- Tests HTTP endpoint availability
- Supports basic auth validation if PASSWORD set
- Command: `curl --fail http://localhost:$CUSTOM_PORT/`

### Security Considerations
- **Default Auth**: None (PASSWORD must be set)
- **Recommended**: Use behind reverse proxy with SSL
- **Supported**: Nginx, Nginx Proxy Manager
- **User Isolation**: Runs as non-root user (abc)

## Common Operations

### Building Locally
```bash
docker build --pull --rm -f "Dockerfile" -t obsidian-remote:latest "."
```

### Running Container
```bash
docker run -d \
  -v ./vaults:/vaults \
  -v ./config:/config \
  -p 8080:8080 \
  ghcr.io/sytone/obsidian-remote:latest
```

### Reloading Obsidian
- Close Obsidian UI in browser
- Right-click to show menu
- Reopen application (no container restart needed)

### Git Integration
- Add `DOCKER_MODS=linuxserver/mods:universal-git`
- SSH keys stored in /config/.ssh
- Compatible with obsidian-git plugin

## Development Guidelines

### Testing Approach
- Manual testing via browser access
- Healthcheck validates container health
- Multi-platform builds tested via GitHub Actions

### Version Management
- Obsidian version: ARG in Dockerfile (currently 1.8.10)
- Container version: Git tags (semver)
- Auto-update: Obsidian updates itself within container

### Contribution Pattern
- Issues tracked on GitHub
- PRs require multi-arch build success
- Community examples integrated into README

## Known Limitations & Workarounds

1. **Container Recreation**: Updates require rebuilding if not using auto-update
2. **ARM64 Registry**: Separate Docker Hub location (not unified with GHCR)
3. **IME Input**: Requires enabling "IME Input Mode" in side panel for non-Latin input
4. **Font Support**: Additional fonts require volume mounting or INSTALL_PACKAGES

## Integration Points

### Reverse Proxy Support
- Nginx (with websocket support)
- Nginx Proxy Manager
- Requires `SUBFOLDER` env var if using subpath

### Plugin Compatibility
- **obsidian-git**: Fully supported with git mod
- **All community plugins**: Should work (Electron-based)
- **Mobile-specific plugins**: May have compatibility issues

## Future Considerations

- Unified multi-arch registry (GHCR for both amd64/arm64)
- Automated Obsidian version updates
- Enhanced security defaults (mandatory auth)
- Better font/language pack management
