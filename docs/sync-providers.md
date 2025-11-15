# Vault Synchronization Providers

Keep your Obsidian vaults in sync across multiple devices using optional synchronization services. This guide covers available providers, setup workflows, and best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Available Providers](#available-providers)
  - [Syncthing (Peer-to-Peer)](#syncthing-peer-to-peer)
  - [rclone (Cloud Storage)](#rclone-cloud-storage)
- [Comparison Matrix](#comparison-matrix)
- [Choosing a Provider](#choosing-a-provider)
- [Multi-Provider Setup](#multi-provider-setup)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Overview

Obsidian Remote supports optional vault synchronization through separate Docker Compose service files. You can enable one or multiple sync providers by layering additional compose files on top of your base Obsidian deployment.

**Key Benefits:**
- 📁 Automatic file synchronization across devices
- 🔄 Real-time or near real-time updates
- 🔒 No manual file transfers required
- 🌐 Multiple sync strategies (P2P, cloud, or both)
- 🛡️ Conflict resolution built-in

## Available Providers

### Syncthing (Peer-to-Peer)

**Direct device-to-device synchronization without cloud storage**

Syncthing creates a secure, encrypted peer-to-peer mesh network between your devices. Files sync directly between devices without any intermediate cloud storage.

**Features:**
- ✅ **Zero cloud dependency** - Data never leaves your network
- ✅ **Fast LAN transfers** - Gigabit speeds on local networks
- ✅ **End-to-end encryption** - All data encrypted in transit
- ✅ **Privacy-focused** - No third-party access to your data
- ✅ **Cross-platform** - Works on Windows, Mac, Linux, Android, iOS
- ✅ **Free and open source** - No subscription fees

**Use Cases:**
- Syncing between home and office networks
- Multiple devices on the same LAN
- Privacy-conscious users
- Users without reliable internet connections

**Setup Guide:** [Syncthing Setup Guide](sync-syncthing-guide.md)

### rclone (Cloud Storage)

**Sync with 40+ cloud storage providers**

rclone mounts cloud storage as a local filesystem, enabling seamless sync with major cloud providers like Google Drive, Dropbox, OneDrive, and many more.

**Features:**
- ✅ **Broad provider support** - 40+ cloud platforms
- ✅ **Centralized backup** - Automatic cloud backup of vaults
- ✅ **Access anywhere** - Internet-only access (no LAN required)
- ✅ **Versioning support** - Many providers offer version history
- ✅ **Cost-effective** - Use existing cloud storage subscriptions
- ✅ **Flexible configuration** - Per-provider performance tuning

**Supported Providers (partial list):**
- Google Drive
- Dropbox
- Microsoft OneDrive
- Box
- pCloud
- Amazon S3
- Backblaze B2
- SFTP servers
- Many more...

**Use Cases:**
- Access vaults from anywhere with internet
- Centralized cloud backup strategy
- Leveraging existing cloud storage
- Teams sharing vaults via cloud services

**Setup Guide:** [rclone Setup Guide](sync-rclone-guide.md)

## Comparison Matrix

| Feature | Syncthing | rclone |
|---------|-----------|--------|
| **Network Required** | LAN or WAN (direct P2P) | Internet (cloud API access) |
| **Speed (LAN)** | Very Fast (gigabit+) | N/A (cloud-dependent) |
| **Speed (WAN)** | Fast (direct connection) | Moderate (API rate limits) |
| **Cloud Backup** | No | Yes |
| **Privacy** | Full (P2P encryption) | Provider-dependent |
| **Cost** | Free | Provider storage costs |
| **Setup Complexity** | Medium | Medium-High (OAuth) |
| **Multi-device** | Yes (P2P mesh) | Yes (cloud hub-and-spoke) |
| **Offline Access** | Yes (after initial sync) | Limited (cache only) |
| **Bandwidth Usage** | Efficient (delta sync) | Higher (full file transfers) |
| **Conflict Handling** | Automatic (.stconflict files) | Provider-dependent |

## Choosing a Provider

### Use Syncthing if you:
- ✅ Want maximum privacy and no cloud dependency
- ✅ Have devices on the same local network frequently
- ✅ Need fast synchronization speeds
- ✅ Don't want to pay for cloud storage
- ✅ Prefer decentralized architecture

### Use rclone if you:
- ✅ Need to access vaults from anywhere with internet
- ✅ Want automatic cloud backup
- ✅ Already have cloud storage subscriptions
- ✅ Need version history features
- ✅ Don't have devices on the same network

### Use Both if you:
- ✅ Want fast LAN sync AND cloud backup
- ✅ Need redundant sync paths
- ✅ Want maximum availability across scenarios

**⚠️ Warning:** Using multiple sync providers simultaneously can cause sync conflicts. See [Multi-Provider Setup](#multi-provider-setup) for best practices.

## Multi-Provider Setup

You can run multiple sync providers simultaneously, but careful configuration is required to avoid conflicts.

### Running Syncthing + rclone

**Start both services:**
```bash
docker-compose -f docker-compose.yml \
  -f docker-compose.sync-syncthing.yml \
  -f docker-compose.sync-rclone.yml \
  up -d
```

**Best Practices:**

1. **Primary and Secondary Roles**
   - Choose one provider as primary (active editing sync)
   - Use the other as backup/archive only
   - Example: Syncthing for active sync, rclone for nightly backup

2. **Avoid Simultaneous Active Sync**
   - Don't edit files while both services are actively syncing
   - Use one provider per workflow session
   - Configure rclone with longer sync intervals if using both

3. **Monitor for Conflicts**
   - Check for `.stconflict` files (Syncthing conflicts)
   - Review cloud provider conflict resolution
   - Regularly verify vault integrity

4. **Directory Partitioning** (Advanced)
   - Sync different vaults with different providers
   - Use Syncthing for active vault, rclone for archive vault
   - Requires separate volume mounts (custom compose configuration)

## Security Considerations

### Syncthing Security

**Critical Setup Steps:**

1. **Enable GUI Authentication**
   ```
   ⚠️ DEFAULT: Syncthing GUI has NO authentication
   Access: http://localhost:8384
   First-time setup: Actions → Settings → GUI → Set Username/Password
   ```

2. **Device Pairing Security**
   - Only add trusted devices by ID
   - Verify device IDs before accepting
   - Use device introducer feature carefully

3. **Folder Sharing**
   - Review shared folder list regularly
   - Use folder passwords for sensitive vaults
   - Configure ignore patterns for sensitive files

4. **Network Exposure**
   - Syncthing uses host network mode
   - Configure firewall to restrict access to trusted IPs
   - Consider VPN for WAN access

### rclone Security

**Critical Setup Steps:**

1. **Protect rclone.conf**
   ```
   Location: ./rclone-config/rclone.conf
   Contains: OAuth tokens, API keys, passwords
   Permissions: Ensure only accessible by container user
   ```

2. **Encrypt rclone Configuration**
   ```bash
   # Optional: Encrypt sensitive rclone config
   docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config
   # During setup, choose to set configuration password
   ```

3. **Cloud Provider Security**
   - Use OAuth (don't embed passwords in config)
   - Enable 2FA on cloud provider accounts
   - Review cloud provider access logs regularly
   - Use read-only tokens if only backup is needed

4. **Data Encryption at Rest**
   - Consider rclone's crypt backend for cloud encryption
   - Encrypts files before uploading to cloud
   - See rclone crypt documentation

## Troubleshooting

### Syncthing Issues

**Problem: Devices not discovering each other**

Solution:
```bash
# Check Syncthing is using host network mode
docker-compose -f docker-compose.sync-syncthing.yml config | grep "network_mode"

# Verify ports are accessible
sudo netstat -tulpn | grep syncthing

# Check firewall rules (allow ports 22000, 21027)
sudo ufw status
```

**Problem: Slow sync speeds**

Solution:
- Ensure host network mode is enabled (not bridge)
- Check for bandwidth limits in Syncthing GUI
- Verify LAN connection (not routing through WAN relay)
- Settings → Connections → Rate Limits

**Problem: Permission errors**

Solution:
```bash
# Verify PUID/PGID match between Obsidian and Syncthing
docker exec obsidian-remote id
docker exec obsidian-sync-syncthing id

# Check vault directory ownership
docker exec obsidian-sync-syncthing ls -la /vaults
```

### rclone Issues

**Problem: Mount fails to start**

Solution:
```bash
# Check rclone config exists
docker exec obsidian-sync-rclone ls /config/rclone/

# Verify FUSE device available
ls -l /dev/fuse

# Check container logs
docker-compose -f docker-compose.sync-rclone.yml logs rclone
```

**Problem: Slow cloud sync**

Solution:
- Check provider API rate limits (Google Drive: 2 req/sec)
- Adjust VFS cache mode in compose file
- Consider using `--vfs-cache-mode full` for better performance
- Review provider-specific tuning in rclone docs

**Problem: OAuth token expired**

Solution:
```bash
# Regenerate OAuth token
docker-compose -f docker-compose.sync-rclone.yml run --rm rclone config

# Select existing remote and refresh authorization
```

### General Sync Conflicts

**Problem: Conflicting file versions**

Syncthing:
- Look for `.stconflict` files in vault
- Review and merge changes manually
- Configure conflict resolution preferences in GUI

rclone:
- Depends on cloud provider
- Check provider's conflict resolution (Google Drive creates copies)
- Use `rclone dedupe` command to clean up duplicates

**Problem: Unexpected file deletions**

Solution:
- Enable versioning in sync provider
- Syncthing: File Versioning → Staggered or External
- rclone: Use provider's trash/version history features
- Regularly backup vault before sync setup

## Next Steps

- **Set up Syncthing:** [Syncthing Setup Guide](sync-syncthing-guide.md)
- **Set up rclone:** [rclone Setup Guide](sync-rclone-guide.md)
- **Return to main README:** [README.md](../README.md)

## Support

For issues specific to:
- **Syncthing:** [Syncthing Forum](https://forum.syncthing.net/)
- **rclone:** [rclone Forum](https://forum.rclone.org/)
- **Obsidian Remote:** [GitHub Issues](https://github.com/leex279/obsidian-webversion/issues)
