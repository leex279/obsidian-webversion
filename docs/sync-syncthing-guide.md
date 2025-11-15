# Syncthing Vault Synchronization Guide

Complete setup guide for peer-to-peer vault synchronization using Syncthing with Obsidian Remote.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
  - [Step 1: Start Syncthing Service](#step-1-start-syncthing-service)
  - [Step 2: Secure the GUI](#step-2-secure-the-gui)
  - [Step 3: Device Pairing](#step-3-device-pairing)
  - [Step 4: Folder Configuration](#step-4-folder-configuration)
  - [Step 5: Verify Synchronization](#step-5-verify-synchronization)
- [Advanced Configuration](#advanced-configuration)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)
- [Performance Tuning](#performance-tuning)

## Overview

Syncthing provides **peer-to-peer synchronization** between devices without requiring cloud storage. Files sync directly between your Obsidian Remote instances and other devices running Syncthing.

**Key Features:**
- 🔒 End-to-end encryption
- 🚀 Fast LAN transfers (gigabit speeds)
- 🌐 Works across LAN and WAN
- 🆓 Free and open source
- 📱 Cross-platform (Windows, Mac, Linux, Android, iOS)

## Prerequisites

Before starting, ensure you have:

- ✅ Obsidian Remote running successfully
  ```bash
  docker-compose up -d
  docker-compose ps  # Verify obsidian-remote is healthy
  ```

- ✅ Network connectivity between devices
  - Same LAN: Devices on same network (recommended for speed)
  - WAN: Devices on different networks (uses relay servers)

- ✅ Firewall configuration (if applicable)
  - Allow incoming TCP/UDP on port 22000 (file transfers)
  - Allow incoming UDP on port 21027 (local discovery)

- ✅ `.env.sync` file configured
  ```bash
  cp .env.sync.example .env.sync
  # Edit PUID/PGID to match your main .env file
  ```

## Quick Start

**Fastest path to get Syncthing running:**

```bash
# 1. Start Syncthing service alongside Obsidian
docker-compose -f docker-compose.yml -f docker-compose.sync-syncthing.yml up -d

# 2. Wait for services to start
sleep 20

# 3. Access Syncthing GUI
# Open browser: http://localhost:8384

# 4. CRITICAL: Set GUI authentication immediately
# Actions → Settings → GUI → Set Username/Password

# 5. Get your Device ID
# Actions → Show ID → Copy the alphanumeric string

# 6. On remote device: Install Syncthing and exchange Device IDs

# 7. Configure folder sync (covered in Detailed Setup)
```

**⚠️ Security Warning:** Syncthing GUI has **NO default authentication**. Set a password immediately!

## Detailed Setup

### Step 1: Start Syncthing Service

Start Syncthing alongside your existing Obsidian Remote container:

```bash
# Start both Obsidian and Syncthing
docker-compose -f docker-compose.yml -f docker-compose.sync-syncthing.yml up -d

# Verify both containers are running
docker-compose -f docker-compose.yml -f docker-compose.sync-syncthing.yml ps
```

**Expected Output:**
```
NAME                       STATUS              PORTS
obsidian-remote           Up (healthy)        0.0.0.0:8080->8080/tcp
obsidian-sync-syncthing   Up (healthy)        (host network mode)
```

**Verify Syncthing is accessible:**
```bash
curl -I http://localhost:8384
# Should return HTTP 301 (redirect to GUI)
```

### Step 2: Secure the GUI

**🔴 CRITICAL SECURITY STEP**

By default, Syncthing GUI is accessible at `http://localhost:8384` **WITHOUT authentication**. Anyone on your network can access it.

**Set authentication:**

1. Open browser to `http://localhost:8384`
2. You should see Syncthing web interface
3. Click **Actions** (top-right) → **Settings**
4. Navigate to **GUI** tab
5. Set **GUI Authentication**:
   - **User:** Choose a username (e.g., `admin`)
   - **Password:** Strong password (12+ characters recommended)
6. Click **Save**
7. Browser will prompt for authentication - enter your credentials

**Optional but recommended:**

8. In the same GUI settings, enable **HTTPS**:
   - Check "Use HTTPS for GUI"
   - Syncthing generates self-signed certificate automatically
   - Access GUI at `https://localhost:8384` (accept browser warning for self-signed cert)

**Verify security:**
```bash
# GUI should now require authentication
curl -I http://localhost:8384
# Should return 401 Unauthorized (without credentials)
```

### Step 3: Device Pairing

To sync between devices, each device needs the other's unique Device ID.

#### Get Your Device ID

**On Obsidian Remote server:**

1. Open Syncthing GUI: `http://localhost:8384`
2. Click **Actions** → **Show ID**
3. Copy the **Device ID** (example: `P56IOI7-MZJNU2Y-IQGDREY-DM2MGTI-MN6HWMU-SJR4A4A-M44IT5R-7RBFZA3`)
4. Save this ID - you'll need it for pairing

**Alternative: Get Device ID from CLI:**
```bash
docker exec obsidian-sync-syncthing cat /config/config.xml | grep deviceID
```

#### Add Remote Device

**On each device that needs to sync:**

1. Install Syncthing:
   - **Another Obsidian Remote:** Follow this same guide
   - **Windows/Mac/Linux:** Download from [syncthing.net/downloads](https://syncthing.net/downloads/)
   - **Android:** Install from [Google Play](https://play.google.com/store/apps/details?id=com.nutomic.syncthingandroid)
   - **iOS:** Install from [App Store](https://apps.apple.com/app/mobius-sync/id1539203216) (third-party client)

2. In Syncthing GUI, click **Add Remote Device**
3. Enter the **Device ID** from the other device
4. Set **Device Name** (e.g., "Home Laptop", "Office Desktop")
5. Choose **Share Folders with Device** (covered in Step 4)
6. Click **Save**

**Accept the pairing on the remote device:**

7. On the remote device, you'll see a notification: "Device X wants to connect"
8. Click **Add Device**
9. Verify the Device ID matches
10. Click **Save**

**Verify connection:**
```
GUI → Remote Devices → Should show "Connected" status
```

### Step 4: Folder Configuration

Configure the `/vaults` folder to sync between devices.

#### Share Vault Folder from Obsidian Remote

**On your Obsidian Remote server:**

1. In Syncthing GUI, go to **Folders** section
2. Click **Add Folder**
3. Configure folder:
   - **Folder Label:** `Obsidian Vaults`
   - **Folder ID:** `obsidian-vaults` (auto-generated, leave as-is)
   - **Folder Path:** `/vaults`
   - **File Versioning:** Recommended → Select "Staggered" (keeps version history)

4. Go to **Sharing** tab
5. Select the remote device(s) to share with
6. Click **Save**

**Accept folder sharing on remote device:**

7. On remote device, you'll see notification: "Device X wants to share folder 'Obsidian Vaults'"
8. Click **Add**
9. Configure folder path on remote device:
   - For Obsidian Remote: Use `/vaults`
   - For desktop Syncthing: Choose a local directory (e.g., `C:\Users\YourName\ObsidianVaults`)
10. Click **Save**

#### Configure Folder Options (Optional)

**Recommended settings for Obsidian vaults:**

- **File Versioning:** Staggered (keeps old versions for 30 days)
  - Protects against accidental deletions
  - Settings → Versioning → Staggered File Versioning
  - Max Age: 30 days

- **Ignore Patterns:** Exclude temporary files
  ```
  .obsidian/workspace*
  .obsidian/cache
  .trash
  ```

- **Watch for Changes:** Enable for faster sync
  - Advanced → Watch for Changes: ✅

- **Rescan Interval:** 60 seconds (default is good for most cases)

### Step 5: Verify Synchronization

**Test the sync:**

1. Create a test file in one vault:
   ```bash
   # On Obsidian Remote
   docker exec obsidian-remote sh -c 'echo "# Sync Test" > /vaults/sync-test.md'
   ```

2. Check Syncthing GUI:
   - Should show "Syncing (X%)" status
   - Wait for "Up to Date"

3. Verify file appears on remote device:
   - Check remote Syncthing folder
   - File should appear within seconds (LAN) or minutes (WAN)

4. Edit file on remote device
5. Verify changes sync back to Obsidian Remote:
   ```bash
   docker exec obsidian-remote cat /vaults/sync-test.md
   ```

**Check sync status:**
```bash
# View Syncthing logs
docker-compose -f docker-compose.sync-syncthing.yml logs -f syncthing

# Check for errors
docker exec obsidian-sync-syncthing cat /config/logs/*.log
```

## Advanced Configuration

### Custom Sync Folders

Sync specific vaults instead of all vaults:

1. Create subdirectories in `/vaults`:
   ```bash
   docker exec obsidian-remote mkdir -p /vaults/personal /vaults/work
   ```

2. In Syncthing GUI, add separate folders:
   - Folder 1: `/vaults/personal` → Share with personal devices only
   - Folder 2: `/vaults/work` → Share with work devices only

### Selective Sync (Ignore Patterns)

Exclude certain files from sync:

**Edit Folder → Ignore Patterns:**
```
// Ignore Obsidian workspace (per-device)
.obsidian/workspace*
.obsidian/cache

// Ignore system files
.DS_Store
Thumbs.db

// Ignore large files
*.mp4
*.mkv

// Ignore specific folders
private/
draft/
```

**Regex patterns supported:**
```
// Ignore all PDFs
(?i)*.pdf

// Ignore temp folders
**/tmp/**
```

### Syncthing Discovery Servers

**LAN discovery works automatically** via host network mode.

**For WAN discovery** (devices on different networks):

1. **Default:** Syncthing uses public discovery servers
   - Settings → Connections → Global Discovery: ✅ (enabled by default)

2. **Private discovery server** (advanced):
   - Run your own discovery server
   - Settings → Connections → Discovery Servers → Add custom server

3. **Static addresses** (bypass discovery):
   - Actions → Settings → Device → Advanced → Addresses
   - Add: `tcp://your-server-ip:22000`

### Device Introducer

Automatically share device pairing across trusted devices:

1. Edit remote device settings
2. Enable **Introducer**
3. New devices added to this device will auto-propagate to introducers

**⚠️ Use cautiously:** Only enable for fully trusted devices.

## Security Best Practices

### 1. GUI Security

✅ **Always set GUI authentication**
✅ **Enable HTTPS for GUI access**
✅ **Restrict GUI to localhost** (default is safe)

If you need remote GUI access:
```yaml
# In docker-compose.sync-syncthing.yml, add:
environment:
  - STGUIADDRESS=0.0.0.0:8384  # WARNING: Exposes GUI to network
```

Then use SSH tunnel or VPN for secure remote access:
```bash
# SSH tunnel to access GUI remotely
ssh -L 8384:localhost:8384 user@your-server
# Access GUI at http://localhost:8384 on your local machine
```

### 2. Device Trust

✅ **Only add trusted devices** by verifying Device IDs
✅ **Review device list regularly**
✅ **Remove unused devices** promptly

### 3. Folder Permissions

✅ **Use folder passwords** for sensitive vaults:
   - Folder Settings → Advanced → Folder Password

✅ **Review shared folder list** on each device

### 4. Network Security

✅ **Use firewall rules** to restrict Syncthing ports:
```bash
# Example: UFW firewall (Ubuntu)
sudo ufw allow from 192.168.1.0/24 to any port 22000 proto tcp
sudo ufw allow from 192.168.1.0/24 to any port 22000 proto udp
sudo ufw allow from 192.168.1.0/24 to any port 21027 proto udp
```

✅ **Use VPN** for WAN sync (encrypts relay traffic):
   - WireGuard or OpenVPN tunnel between devices
   - Syncthing sees devices as "local" over VPN

### 5. Version History

✅ **Enable file versioning** to recover from accidental deletions:
   - Folder → Versioning → Staggered File Versioning
   - Max Age: 30-90 days

## Troubleshooting

### Device Not Discovering on LAN

**Problem:** Devices on same network not seeing each other

**Solution:**
```bash
# 1. Verify host network mode
docker-compose -f docker-compose.sync-syncthing.yml config | grep network_mode
# Should show: network_mode: host

# 2. Check UDP port 21027 accessible
sudo netstat -ulpn | grep 21027

# 3. Verify local discovery enabled
# GUI → Settings → Connections → Local Discovery Server: ✅

# 4. Check firewall allows UDP 21027
sudo ufw status | grep 21027

# 5. Manually add device by IP
# Device Settings → Addresses → Add: tcp://192.168.1.100:22000
```

### Slow Sync Speeds

**Problem:** Sync taking too long

**Solutions:**

1. **Check if using relay servers:**
   ```
   GUI → Device status → Check for "Relay" indicator
   If showing relay: Devices not connecting directly
   ```

2. **Force direct connection:**
   ```
   # Add static address for remote device
   Device Settings → Advanced → Addresses
   Add: tcp://REMOTE_IP:22000
   ```

3. **Verify host network mode:**
   ```bash
   # Bridge mode severely limits LAN speed
   docker inspect obsidian-sync-syncthing | grep NetworkMode
   # Should show "host"
   ```

4. **Disable bandwidth limits:**
   ```
   Settings → Connections → Rate Limits → Remove limits
   ```

### Permission Errors

**Problem:** "Permission denied" errors in Syncthing logs

**Solution:**
```bash
# 1. Check PUID/PGID match
docker exec obsidian-remote id
docker exec obsidian-sync-syncthing id
# UID and GID should match

# 2. Verify vault directory ownership
docker exec obsidian-sync-syncthing ls -la /vaults
# Owner should match PUID:PGID

# 3. Fix permissions if needed
docker exec obsidian-sync-syncthing chown -R 1000:1000 /vaults
```

### Conflicts (`.stconflict` files)

**Problem:** Files with `.stconflict` extension appearing

**Cause:** Same file edited on multiple devices simultaneously

**Resolution:**

1. **Find conflicts:**
   ```bash
   docker exec obsidian-remote find /vaults -name "*.stconflict"
   ```

2. **Review and merge manually:**
   - Open both the original file and `.stconflict` file
   - Merge changes as needed
   - Delete `.stconflict` file after merging

3. **Prevent future conflicts:**
   - Avoid editing same file on multiple devices simultaneously
   - Use Obsidian's conflict resolution UI
   - Enable file versioning for recovery

### Syncthing Not Starting

**Problem:** Container fails to start or exits immediately

**Solution:**
```bash
# 1. Check logs
docker-compose -f docker-compose.sync-syncthing.yml logs syncthing

# 2. Verify config directory permissions
ls -la ./syncthing-config
# Should be writable

# 3. Remove config and restart (CAUTION: Loses device ID)
rm -rf ./syncthing-config/*
docker-compose -f docker-compose.sync-syncthing.yml up -d

# 4. Check for port conflicts
sudo netstat -tulpn | grep 8384
# If another process using port 8384, stop it
```

## Performance Tuning

### Optimize for Large Vaults

**For vaults with 10,000+ files:**

1. **Increase file handle limits:**
   ```yaml
   # In docker-compose.sync-syncthing.yml, add:
   ulimits:
     nofile:
       soft: 65536
       hard: 65536
   ```

2. **Adjust database settings:**
   ```
   Settings → Advanced → Database Tuning → Auto
   ```

3. **Disable watch for changes** (reduces CPU):
   ```
   Folder → Advanced → Watch for Changes: ❌
   Increase Rescan Interval: 300 seconds
   ```

### Optimize for Fast Networks

**For gigabit+ LANs:**

1. **Increase connection limits:**
   ```
   Settings → Connections → Maximum Receive Rate: Unlimited
   Settings → Connections → Maximum Send Rate: Unlimited
   ```

2. **Enable parallel transfers:**
   ```
   Folder → Advanced → Copiers: 4
   Hashers: 2
   ```

3. **Use host network mode** (already configured in template)

### Optimize for WAN Sync

**For internet-only connectivity:**

1. **Enable bandwidth limits:**
   ```
   Settings → Connections → Rate Limits
   Send: 10 Mbps (adjust based on upload speed)
   Receive: 50 Mbps (adjust based on download speed)
   ```

2. **Configure relay servers:**
   ```
   Settings → Connections → Relay Server
   Enable: ✅
   Default relays: ✅
   ```

3. **Use compression:**
   ```
   Device → Advanced → Compression → Metadata
   ```

## Next Steps

- **Configure multiple devices:** Repeat device pairing for all devices
- **Set up cloud backup:** Add [rclone](sync-rclone-guide.md) for redundant cloud backup
- **Monitor sync status:** Check Syncthing GUI regularly for conflicts
- **Return to sync overview:** [Vault Synchronization Providers](sync-providers.md)

## Additional Resources

- **Syncthing Official Docs:** https://docs.syncthing.net/
- **Syncthing Forum:** https://forum.syncthing.net/
- **LinuxServer.io Syncthing:** https://docs.linuxserver.io/images/docker-syncthing/
- **Obsidian Community:** https://obsidian.md/community

## Support

For issues specific to:
- **Syncthing setup:** [Syncthing Forum](https://forum.syncthing.net/)
- **Obsidian Remote:** [GitHub Issues](https://github.com/leex279/obsidian-webversion/issues)
