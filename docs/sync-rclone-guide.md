# rclone Cloud Storage Synchronization Guide

Setup guide for syncing Obsidian vaults with cloud storage providers (Google Drive, Dropbox, OneDrive, and 40+ others) using rclone.

## 📋 Table of Contents

- [Overview](#overview)
- [Important Notes](#important-notes)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration Workflow](#configuration-workflow)
  - [Step 1: Interactive Config Setup](#step-1-interactive-config-setup)
  - [Step 2: Start rclone Service](#step-2-start-rclone-service)
  - [Step 3: Verify Mount](#step-3-verify-mount)
- [Provider-Specific Setup](#provider-specific-setup)
  - [Google Drive](#google-drive)
  - [Dropbox](#dropbox)
  - [Microsoft OneDrive](#microsoft-onedrive)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

## Overview

rclone mounts cloud storage as a local filesystem, enabling seamless synchronization between Obsidian Remote and popular cloud providers.

**Key Features:**
- ☁️ Supports 40+ cloud storage providers
- 🔄 Automatic bidirectional sync
- 💾 Cloud backup of your vaults
- 🌐 Access vaults from anywhere with internet
- 🔒 Supports encryption (via rclone crypt)

**Supported Providers (Partial List):**
- Google Drive
- Dropbox
- Microsoft OneDrive / SharePoint
- Box
- pCloud
- Amazon S3 / Glacier
- Backblaze B2
- Wasabi
- SFTP / FTP servers
- WebDAV
- And many more...

**Full list:** https://rclone.org/overview/

## Important Notes

### ⚠️ Critical Limitations

1. **Interactive Configuration Required**
   - rclone requires **OAuth authentication** via web browser
   - Configuration **CANNOT be fully automated**
   - You must manually authorize cloud provider access

2. **Provider API Rate Limits**
   - Google Drive: 2 requests/second (very slow for large vaults)
   - Dropbox: Moderate limits (varies by plan)
   - OneDrive: Good performance for personal accounts
   - Check provider-specific limits before setup

3. **Template Configuration**
   - The `docker-compose.sync-rclone.yml` is a **template**
   - Requires customization based on your chosen provider
   - VFS cache mode may need adjustment for performance

4. **Internet Dependency**
   - Requires active internet connection for sync
   - Offline access limited to locally cached files
   - Use Syncthing for offline-first sync

## Prerequisites

Before starting, ensure you have:

- ✅ Obsidian Remote running successfully
  ```bash
  docker-compose up -d
  docker-compose ps  # Verify obsidian-remote is healthy
  ```

- ✅ Cloud storage account
  - Google Drive (free 15GB)
  - Dropbox (free 2GB)
  - OneDrive (free 5GB, 1TB with Microsoft 365)
  - Or any supported provider

- ✅ Internet connectivity
  - Stable connection required for initial sync
  - Bandwidth: Consider upload/download limits

- ✅ `.env.sync` file configured
  ```bash
  cp .env.sync.example .env.sync
  # Edit RCLONE_REMOTE and RCLONE_REMOTE_PATH
  ```

## Quick Start

**Fastest path to get rclone working:**

```bash
# 1. Run interactive rclone config
docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config

# Follow interactive prompts:
# - Choose provider (e.g., "drive" for Google Drive)
# - Complete OAuth flow in browser
# - Name your remote (e.g., "gdrive")
# - Save configuration

# 2. Update .env.sync with your remote name
nano .env.sync
# Set: RCLONE_REMOTE=gdrive (use the name you chose)
# Set: RCLONE_REMOTE_PATH=/ObsidianVaults (path in cloud storage)

# 3. Start rclone service
docker-compose -f docker-compose.yml -f docker-compose.sync-rclone.yml up -d

# 4. Verify mount
docker exec obsidian-sync-rclone ls /vaults
```

**⚠️ Warning:** Initial sync may take time depending on vault size and provider API limits.

## Configuration Workflow

### Step 1: Interactive Config Setup

rclone configuration is interactive and requires OAuth authentication via web browser.

#### Run rclone Config

```bash
# Start interactive config container
docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config
```

**You'll see the rclone interactive menu:**
```
No remotes found, make a new one?
n) New remote
s) Set configuration password
q) Quit config
n/s/q> n
```

#### Choose Provider

**Enter `n` for new remote, then:**

```
Name> gdrive
Type of storage> drive

# OR for Dropbox:
Type of storage> dropbox

# OR for OneDrive:
Type of storage> onedrive
```

**See full provider list:**
```
Type of storage> ?
# Shows all 40+ providers with numbers
```

#### Complete OAuth Flow

**For Google Drive example:**

```
Google Application Client Id (leave blank to use rclone's)>
[Press Enter to use default]

Google Application Client Secret (leave blank to use rclone's)>
[Press Enter to use default]

Scope that rclone should use when requesting access from drive>
1 / Full access all files
2 / Read-only access to all files
3 / Access to files created by rclone only
scope> 1

Use auto config?
y) Yes (default)
n) No
y/n> y
```

**Browser will open automatically:**
1. Select your Google account
2. Click "Allow" to grant rclone access
3. Return to terminal

```
Configure this as a team drive?
y) Yes
n) No
y/n> n

[gdrive]
type = drive
scope = drive
token = {"access_token":"..."}

Keep this "gdrive" remote?
y) Yes
n) No
y/e/d> y

Current remotes:
Name                 Type
====                 ====
gdrive              drive

e/n/d/r/c/s/q> q
# Quit config
```

#### Verify Configuration

```bash
# Check config file created
docker-compose -f docker-compose.sync-rclone.yml run --rm rclone listremotes

# Should show:
# gdrive:
```

### Step 2: Start rclone Service

**Configure environment variables:**

Edit `.env.sync`:
```bash
# Remote name (from rclone config)
RCLONE_REMOTE=gdrive

# Path within cloud storage
RCLONE_REMOTE_PATH=/ObsidianVaults

# Or use root:
# RCLONE_REMOTE_PATH=/
```

**Start the service:**
```bash
# Start Obsidian + rclone
docker-compose -f docker-compose.yml -f docker-compose.sync-rclone.yml up -d

# Monitor startup
docker-compose -f docker-compose.sync-rclone.yml logs -f rclone
```

**Expected output:**
```
obsidian-sync-rclone  | Mounting gdrive:/ObsidianVaults to /vaults
obsidian-sync-rclone  | The service rclone has been started
```

### Step 3: Verify Mount

**Check mount is accessible:**
```bash
# List files in mount
docker exec obsidian-sync-rclone ls /vaults

# Check mount status
docker exec obsidian-sync-rclone mount | grep /vaults
```

**Test file sync:**
```bash
# Create test file in Obsidian
docker exec obsidian-remote sh -c 'echo "# Cloud Sync Test" > /vaults/cloud-test.md'

# Wait a few seconds for upload

# Verify file appears in cloud
# Check Google Drive web interface or:
docker-compose -f docker-compose.sync-rclone.yml run --rm rclone ls gdrive:/ObsidianVaults
```

## Provider-Specific Setup

### Google Drive

**Setup Steps:**

1. **Run rclone config:**
   ```bash
   docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config
   ```

2. **Choose Google Drive:**
   ```
   Type of storage> drive
   ```

3. **OAuth Setup:**
   - Use default rclone client credentials (recommended)
   - Or create custom OAuth app for higher API limits:
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Create new project
     - Enable Google Drive API
     - Create OAuth credentials
     - Enter Client ID and Secret in rclone config

4. **Select Scope:**
   ```
   1 / Full access all files (recommended for sync)
   ```

5. **Complete OAuth in browser**

**Performance Considerations:**

⚠️ **Google Drive API Limits:**
- 2 requests/second for free tier
- 10 requests/second for paid Google Workspace
- **Very slow for large vaults (10,000+ files)**

**Optimization:**
```bash
# In docker-compose.sync-rclone.yml, adjust mount command:
command: mount gdrive:/ObsidianVaults /vaults \
  --config /config/rclone/rclone.conf \
  --vfs-cache-mode full \
  --vfs-cache-max-size 1G \
  --drive-chunk-size 32M \
  --allow-other \
  --daemon
```

**Shared Drives (Team Drives):**
```
Configure this as a team drive?
y) Yes
```

### Dropbox

**Setup Steps:**

1. **Run rclone config:**
   ```bash
   docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config
   ```

2. **Choose Dropbox:**
   ```
   Type of storage> dropbox
   ```

3. **OAuth Setup:**
   - Use default rclone credentials
   - Or create custom Dropbox app:
     - Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
     - Create new app
     - Full Dropbox access
     - Copy App key and App secret

4. **Complete OAuth in browser**

**Performance Considerations:**

✅ **Dropbox API is moderate speed**
- Better performance than Google Drive for small/medium vaults
- API limits are generous for personal use

**Optimization:**
```bash
# Good default cache settings for Dropbox
command: mount dropbox:/ObsidianVaults /vaults \
  --config /config/rclone/rclone.conf \
  --vfs-cache-mode writes \
  --vfs-cache-max-age 1h \
  --allow-other \
  --daemon
```

### Microsoft OneDrive

**Setup Steps:**

1. **Run rclone config:**
   ```bash
   docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config
   ```

2. **Choose OneDrive:**
   ```
   Type of storage> onedrive
   ```

3. **Select OneDrive Type:**
   ```
   1 / OneDrive Personal or Business
   2 / Sharepoint site
   3 / Type in driveID
   4 / Type in SiteID
   5 / Search a Sharepoint site
   Your choice> 1
   ```

4. **OAuth Setup:**
   - Use default rclone credentials
   - Complete OAuth in browser
   - Select OneDrive account type when prompted

5. **Choose Drive:**
   ```
   Found 1 drive:
   0: OneDrive (business)
   Chose drive to use:> 0
   ```

**Performance Considerations:**

✅ **OneDrive has good API performance**
- Works well for personal accounts
- Microsoft 365 provides 1TB storage

**Optimization:**
```bash
command: mount onedrive:/ObsidianVaults /vaults \
  --config /config/rclone/rclone.conf \
  --vfs-cache-mode full \
  --allow-other \
  --daemon
```

## Advanced Configuration

### Custom Mount Flags

Edit `docker-compose.sync-rclone.yml` to customize mount behavior:

**For better performance (more cache):**
```yaml
command: mount ${RCLONE_REMOTE}:${RCLONE_REMOTE_PATH} /vaults \
  --config /config/rclone/rclone.conf \
  --vfs-cache-mode full \
  --vfs-cache-max-size 10G \
  --vfs-cache-max-age 24h \
  --buffer-size 64M \
  --allow-other \
  --daemon
```

**For lower memory usage:**
```yaml
command: mount ${RCLONE_REMOTE}:${RCLONE_REMOTE_PATH} /vaults \
  --config /config/rclone/rclone.conf \
  --vfs-cache-mode writes \
  --vfs-cache-max-size 1G \
  --buffer-size 16M \
  --allow-other \
  --daemon
```

**For read-only cloud backup:**
```yaml
command: mount ${RCLONE_REMOTE}:${RCLONE_REMOTE_PATH} /vaults \
  --config /config/rclone/rclone.conf \
  --read-only \
  --vfs-cache-mode full \
  --allow-other \
  --daemon
```

### Encryption (rclone crypt)

Encrypt files before uploading to cloud:

1. **Create crypt remote:**
   ```bash
   docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config

   # Create crypt remote pointing to your cloud remote
   Name> gdrive-encrypted
   Type> crypt
   Remote> gdrive:ObsidianVaults/encrypted
   Password> [choose strong password]
   Salt> [choose random salt]
   ```

2. **Update `.env.sync`:**
   ```bash
   RCLONE_REMOTE=gdrive-encrypted
   RCLONE_REMOTE_PATH=/
   ```

3. **Restart service:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.sync-rclone.yml restart rclone
   ```

**⚠️ Important:** Backup encryption password securely. Lost password = lost data.

### Multiple Cloud Providers

Sync with multiple cloud services simultaneously:

1. **Configure multiple remotes:**
   ```bash
   # Add Google Drive, Dropbox, OneDrive all in same rclone config
   ```

2. **Create separate compose files:**
   ```yaml
   # docker-compose.sync-rclone-gdrive.yml
   services:
     rclone-gdrive:
       command: mount gdrive:/Vaults /vaults-gdrive ...

   # docker-compose.sync-rclone-dropbox.yml
   services:
     rclone-dropbox:
       command: mount dropbox:/Vaults /vaults-dropbox ...
   ```

3. **Use union mount** (advanced):
   ```yaml
   # Combine multiple cloud providers into single /vaults
   # See rclone union documentation
   ```

## Troubleshooting

### Mount Fails to Start

**Problem:** Container exits immediately

**Solution:**
```bash
# Check logs
docker-compose -f docker-compose.sync-rclone.yml logs rclone

# Common errors:
# "NOTICE: Config file not found" → Run rclone config first
# "Failed to mount" → Check FUSE device available
# "OAuth token expired" → Refresh OAuth token
```

**Regenerate OAuth token:**
```bash
docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config reconnect REMOTE_NAME:
```

### FUSE Device Not Found

**Problem:** "FUSE device not available"

**Solution:**
```bash
# Check FUSE device exists
ls -l /dev/fuse

# If missing, install FUSE
sudo apt-get install fuse

# Verify container has access
docker run --rm -it --device /dev/fuse rclone/rclone ls
```

### Slow Sync Performance

**Problem:** Files take forever to sync

**Solution:**

1. **Check provider API limits:**
   ```bash
   # Google Drive: 2 req/sec is very slow
   # Consider switching to Dropbox or OneDrive
   ```

2. **Increase cache:**
   ```yaml
   # In docker-compose.sync-rclone.yml
   --vfs-cache-mode full
   --vfs-cache-max-size 10G
   ```

3. **Reduce file operations:**
   ```bash
   # Disable Obsidian auto-sync plugins temporarily
   # Let rclone catch up before editing
   ```

### OAuth Token Expired

**Problem:** "Invalid credentials" error in logs

**Solution:**
```bash
# Refresh OAuth token
docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config reconnect REMOTE_NAME:

# Or regenerate completely
docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config
# Delete remote and recreate
```

### Files Not Appearing in Cloud

**Problem:** Files created in Obsidian don't sync to cloud

**Solution:**
```bash
# Check mount is active
docker exec obsidian-sync-rclone mount | grep /vaults

# Check file actually exists in mount
docker exec obsidian-sync-rclone ls /vaults

# Check rclone logs for errors
docker logs obsidian-sync-rclone

# Manually verify upload
docker-compose -f docker-compose.sync-rclone.yml run --rm rclone ls REMOTE:PATH
```

## Performance Optimization

### Cache Modes

**VFS Cache Mode Options:**

- **`writes`** (default, balanced):
  - Caches writes before uploading
  - Reads go to cloud
  - Good for most use cases

- **`full`** (best performance):
  - Caches reads and writes locally
  - Fastest but uses more disk space
  - Recommended for active editing

- **`off`** (minimal cache):
  - All operations go to cloud immediately
  - Slowest but uses least disk
  - Not recommended for Obsidian

**Configure in compose file:**
```yaml
command: mount ... --vfs-cache-mode full
```

### Provider-Specific Tuning

**Google Drive:**
```yaml
--drive-chunk-size 32M
--drive-upload-cutoff 16M
--vfs-read-chunk-size 128M
```

**Dropbox:**
```yaml
--dropbox-chunk-size 48M
--vfs-read-chunk-size 128M
```

**OneDrive:**
```yaml
--onedrive-chunk-size 10M
--vfs-read-chunk-size 128M
```

### Bandwidth Limits

**Limit upload/download speeds:**
```yaml
command: mount ... \
  --bwlimit 10M  # Limit to 10 MB/s total
  # Or separate:
  --bwlimit-file 5M:2M  # 5M upload, 2M download
```

## Next Steps

- **Add Syncthing for local sync:** [Syncthing Setup Guide](sync-syncthing-guide.md)
- **Compare sync providers:** [Vault Synchronization Providers](sync-providers.md)
- **Return to main README:** [README.md](../README.md)

## Additional Resources

- **rclone Official Docs:** https://rclone.org/docs/
- **rclone Forum:** https://forum.rclone.org/
- **Provider-Specific Docs:**
  - [Google Drive](https://rclone.org/drive/)
  - [Dropbox](https://rclone.org/dropbox/)
  - [OneDrive](https://rclone.org/onedrive/)
  - [All Providers](https://rclone.org/overview/)

## Support

For issues specific to:
- **rclone setup:** [rclone Forum](https://forum.rclone.org/)
- **OAuth issues:** Provider's developer console documentation
- **Obsidian Remote:** [GitHub Issues](https://github.com/leex279/obsidian-webversion/issues)
