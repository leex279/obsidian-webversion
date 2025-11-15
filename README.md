# Obsidian Web Version

Run [Obsidian](https://obsidian.md/) in Docker and access it via your web browser. Perfect for remote access, server deployments, and cloud hosting.

## ✨ Features

- 🌐 **Browser-based access** - Access Obsidian from any device with a web browser
- 🔒 **Production-ready SSL** - Automatic HTTPS with Let's Encrypt via Caddy reverse proxy
- 🔄 **Auto-updates** - Obsidian updates itself within the container
- 🌍 **Multi-language support** - CJK fonts and IME input support
- 📦 **Git integration** - Built-in support for obsidian-git plugin
- 🎨 **Customizable** - Environment variables for user/group IDs, timezone, and more

## 📋 Table of Contents

- [Quick Start](#quick-start)
  - [Local Development](#local-development)
  - [Production Deployment](#production-deployment)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Volumes](#volumes)
- [Features](#features-guide)
  - [Git Integration](#git-integration)
  - [Language Support](#language-support)
  - [Custom Fonts](#custom-fonts)
- [Usage Tips](#usage-tips)
  - [Reloading Obsidian](#reloading-obsidian)
  - [Copy/Paste](#copypaste)
  - [User Permissions](#user-permissions)
- [Building Locally](#building-locally)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Local Development

For local testing and development without SSL:

```bash
# Clone the repository
git clone https://github.com/leex279/obsidian-webversion.git
cd obsidian-webversion

# Copy environment template
cp .env.example .env

# Edit if needed (optional)
nano .env

# Build and start
docker build -t obsidian-remote:local-autorestart .
docker-compose up -d

# Access at http://localhost:8080
```

**⚠️ Warning:** Do not expose port 8080 to the internet without proper security!

### Production Deployment

For production with **automatic HTTPS** and custom domain:

```bash
# Clone the repository
git clone https://github.com/leex279/obsidian-webversion.git
cd obsidian-webversion

# Build the image
docker build -t obsidian-remote:local-autorestart .

# Copy production environment template
cp .env.production.example .env

# Configure your domain and email
nano .env
```

Edit `.env` with your settings:
```bash
DOMAIN=obsidian.example.com
CADDY_EMAIL=admin@example.com
```

**Prerequisites:**
- ✅ Custom domain with DNS A record pointing to your server
- ✅ Ports 80 and 443 accessible from the internet
- ✅ Valid email address for Let's Encrypt

**Deploy:**
```bash
# Start production stack with Caddy reverse proxy
docker-compose -f docker-compose.production.yml up -d

# Monitor SSL certificate issuance
docker-compose -f docker-compose.production.yml logs -f caddy
```

Access securely at `https://obsidian.example.com` 🎉

**📖 For detailed production setup, DNS configuration, and troubleshooting, see:**
**[Production Deployment Guide](docs/production-deployment.md)**

## ⚙️ Configuration

### Environment Variables

#### Core Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PUID` | `1000` | User ID for file permissions (run `id $USER`) |
| `PGID` | `1000` | Group ID for file permissions |
| `TZ` | `Etc/UTC` | Timezone ([List of timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)) |

#### Web Interface

| Variable | Default | Description |
|----------|---------|-------------|
| `CUSTOM_PORT` | `8080` | HTTP port (internal) |
| `CUSTOM_HTTPS_PORT` | `8443` | HTTPS port (internal) |
| `CUSTOM_USER` | - | HTTP Basic auth username (optional) |
| `PASSWORD` | - | HTTP Basic auth password (optional) |
| `TITLE` | `KasmVNC Client` | Browser window title |
| `FM_HOME` | `/vaults` | File manager home directory |

#### Optional Features

| Variable | Example | Description |
|----------|---------|-------------|
| `DOCKER_MODS` | `linuxserver/mods:universal-git` | Add functionality via [LinuxServer mods](https://github.com/linuxserver/docker-mods) |
| `INSTALL_PACKAGES` | `fonts-noto-cjk` | Install additional packages (requires package-install mod) |
| `KEYBOARD` | `en-us-qwerty` | Keyboard layout ([Available layouts](https://github.com/linuxserver/docker-digikam#keyboard-layouts)) |

#### Production Only (Caddy SSL)

| Variable | Example | Description |
|----------|---------|-------------|
| `DOMAIN` | `obsidian.example.com` | Your custom domain (no http://) |
| `CADDY_EMAIL` | `admin@example.com` | Email for Let's Encrypt notifications |

### Volumes

| Path | Description |
|------|-------------|
| `/vaults` | Your Obsidian vaults (notes and files) |
| `/config` | Obsidian configuration and SSH keys for git |

## 📚 Features Guide

### Git Integration

Enable Git support for the [obsidian-git](https://github.com/denolehov/obsidian-git) plugin:

**In `.env` file:**
```bash
DOCKER_MODS=linuxserver/mods:universal-git
```

**Or in `docker-compose.yml`:**
```yaml
environment:
  - DOCKER_MODS=linuxserver/mods:universal-git
```

SSH keys are stored in `/config/.ssh` for GitHub/GitLab authentication.

### Language Support

#### CJK (Chinese, Japanese, Korean)

Install CJK fonts for proper character display:

```bash
DOCKER_MODS=linuxserver/mods:universal-package-install
INSTALL_PACKAGES=fonts-noto-cjk fonts-noto-extra
```

**Enable IME Input:**
1. Click the side panel in the browser interface
2. Enable **IME Input Mode**

![IME Input Mode](./assets/IMEInputMode.png)

### Custom Fonts

Add custom fonts by mounting them as volumes:

**Docker Compose:**
```yaml
volumes:
  - ./vaults:/vaults
  - ./config:/config
  - ./fonts/MyFont:/usr/share/fonts/truetype/myfont
```

## 💡 Usage Tips

### Reloading Obsidian

No need to restart the container! Just reload Obsidian in the browser:

1. Close the Obsidian window
2. Right-click to show the menu
3. Reopen Obsidian

![Reload Example](./assets/ReloadExample.gif)

### Copy/Paste

Access the clipboard for copying/pasting from external sources:

1. Click the circle icon on the left side of the browser window
2. Use the textbox to update or copy from the remote clipboard

![Clipboard](https://user-images.githubusercontent.com/1399443/202805847-a87e2c7c-a5c6-4dea-bbae-4b25b4b5866a.png)

### User Permissions

Match container user to your host user to avoid permission issues:

```bash
# Get your user and group IDs
id $USER

# Set in .env file
PUID=1000  # Your uid
PGID=1000  # Your gid
```

## 🔨 Building Locally

Build the Docker image from source:

```bash
# Build the image
docker build --pull --rm -f "Dockerfile" -t obsidian-remote:local-autorestart .

# Run with docker-compose
docker-compose up -d

# Or run directly
docker run -d \
  -v ./vaults:/vaults \
  -v ./config:/config \
  -p 8080:8080 \
  obsidian-remote:local-autorestart
```

## 🛠️ Troubleshooting

### Common Issues

**Cannot access on port 8080:**
- Check container is running: `docker-compose ps`
- View logs: `docker-compose logs -f`
- Ensure port is not in use: `netstat -tulpn | grep 8080`

**Permission errors on files:**
- Set correct PUID/PGID matching your user: `id $USER`
- Fix ownership: `sudo chown -R 1000:1000 vaults/ config/`

**Fonts not showing:**
- Install font packages with `INSTALL_PACKAGES`
- Or mount font directory to `/usr/share/fonts/truetype/`

**Production SSL issues:**
- See detailed troubleshooting in [Production Deployment Guide](docs/production-deployment.md)
- Verify DNS: `dig +short your-domain.com`
- Check Caddy logs: `docker-compose -f docker-compose.production.yml logs caddy`

### Updates

Obsidian updates automatically inside the container. To update the base image:

```bash
# Rebuild the image
docker build --pull --rm -f "Dockerfile" -t obsidian-remote:local-autorestart .

# Recreate containers
docker-compose up -d --force-recreate

# Or for production
docker-compose -f docker-compose.production.yml up -d --force-recreate
```

## 📄 License

This project builds upon the excellent work from [sytone/obsidian-remote](https://github.com/sytone/obsidian-remote).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## ⭐ Acknowledgments

- [Obsidian.md](https://obsidian.md/) - The amazing note-taking application
- [LinuxServer.io](https://www.linuxserver.io/) - For the excellent base images
- [Caddy](https://caddyserver.com/) - For automatic HTTPS made simple
- Original [obsidian-remote](https://github.com/sytone/obsidian-remote) by sytone
