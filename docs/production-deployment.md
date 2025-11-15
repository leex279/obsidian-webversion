# Production Deployment Guide - Obsidian Remote with Caddy SSL

This guide covers deploying Obsidian Remote to production with automatic HTTPS using Caddy reverse proxy and Let's Encrypt SSL certificates.

## Prerequisites

Before deploying to production, ensure you have:

### 1. Server Requirements

- Linux server with Docker and Docker Compose installed
- Public IP address (static recommended)
- At least 2GB RAM and 10GB disk space
- Open ports 80 (HTTP) and 443 (HTTPS) in firewall

### 2. Domain Configuration

- Custom domain name (e.g., `obsidian.example.com`)
- Access to DNS management for your domain
- Ability to create A/AAAA DNS records

### 3. Email Address

- Valid email address for Let's Encrypt certificate registration
- Used for renewal notifications and account management

## DNS Configuration

**CRITICAL**: Configure DNS BEFORE starting Caddy to avoid Let's Encrypt rate limits.

### Step 1: Create DNS A Record

Point your domain to your server's public IP:

```
Type: A
Name: obsidian (or your chosen subdomain)
Value: YOUR_SERVER_PUBLIC_IP
TTL: 3600 (or your DNS provider's default)
```

For IPv6, also create an AAAA record:

```
Type: AAAA
Name: obsidian
Value: YOUR_SERVER_IPV6_ADDRESS
TTL: 3600
```

### Step 2: Verify DNS Propagation

Wait for DNS propagation (5-30 minutes) and verify:

```bash
# Check A record
dig +short obsidian.example.com

# Or use nslookup
nslookup obsidian.example.com

# Verify it returns your server's IP
```

**Do NOT proceed until DNS is correctly configured!**

## Deployment Steps

### Step 1: Clone Repository and Build Image

```bash
# Clone repository
cd /opt
git clone https://github.com/sytone/obsidian-remote.git
cd obsidian-remote

# Build local image with auto-restart feature
docker build --rm -f "Dockerfile" -t obsidian-remote:local-autorestart .
```

### Step 2: Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env

# Edit with your settings
nano .env
```

**Required variables:**
- `DOMAIN`: Your full domain (e.g., `obsidian.example.com`)
- `CADDY_EMAIL`: Your email for Let's Encrypt

**Optional variables:**
- `PUID/PGID`: Match your user ID (`id $USER`)
- `TZ`: Your timezone
- `PASSWORD`: Enable HTTP basic auth

### Step 3: Prepare Directories

```bash
# Create required directories
mkdir -p vaults config logs/caddy

# Set permissions
chmod 755 vaults config logs
```

### Step 4: Validate Configuration

```bash
# Validate Caddyfile syntax
docker run --rm -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile caddy:2-alpine \
  caddy fmt --overwrite /etc/caddy/Caddyfile

# Validate docker-compose configuration
docker-compose -f docker-compose.production.yml config
```

### Step 5: Deploy Production Stack

```bash
# Start services
docker-compose -f docker-compose.production.yml up -d

# Monitor logs for certificate issuance
docker-compose -f docker-compose.production.yml logs -f caddy
```

**Expected output:**
```
caddy | {"level":"info","ts":...,"msg":"certificate obtained successfully"}
caddy | {"level":"info","ts":...,"msg":"serving initial configuration"}
```

Certificate issuance typically takes 30-120 seconds on first deployment.

### Step 6: Verify Deployment

```bash
# Check container status
docker-compose -f docker-compose.production.yml ps

# Both containers should show "Up" and "healthy"

# Check certificate
curl -I https://obsidian.example.com
# Should return: HTTP/2 200

# Check redirect
curl -I http://obsidian.example.com
# Should return: HTTP/1.1 308 and Location: https://...
```

### Step 7: Access Obsidian

Open your browser and navigate to:
```
https://obsidian.example.com
```

You should see the Obsidian Remote interface with a valid SSL certificate (green lock icon).

## Post-Deployment

### Certificate Renewal

Caddy automatically renews certificates 30 days before expiration. No manual intervention required.

Monitor renewal in logs:
```bash
docker-compose -f docker-compose.production.yml logs -f caddy | grep renew
```

### Backup Important Data

Regularly backup:
- `./vaults/` - Your Obsidian vaults
- `./config/` - Obsidian configuration
- `/var/lib/docker/volumes/caddy_data` - SSL certificates

```bash
# Example backup script
tar -czf backup-$(date +%Y%m%d).tar.gz vaults/ config/

# Backup certificates (requires root)
sudo tar -czf caddy-certs-$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/obsidian-remote_caddy_data
```

### Updates

To update Obsidian or Caddy:

```bash
# Pull latest images
docker pull caddy:2-alpine

# Rebuild Obsidian image
docker build --rm -f "Dockerfile" -t obsidian-remote:local-autorestart .

# Recreate containers
docker-compose -f docker-compose.production.yml up -d --force-recreate
```

## Troubleshooting

### Issue: Certificate Not Issued

**Symptoms:**
- Browser shows "Your connection is not private"
- Logs show "obtaining certificate" errors

**Solutions:**

1. **Verify DNS configuration:**
   ```bash
   dig +short YOUR_DOMAIN
   # Must return your server's public IP
   ```

2. **Check ports are accessible:**
   ```bash
   # From another machine
   nc -zv YOUR_DOMAIN 80
   nc -zv YOUR_DOMAIN 443
   ```

3. **Check firewall:**
   ```bash
   # Ubuntu/Debian
   sudo ufw status
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp

   # CentOS/RHEL
   sudo firewall-cmd --list-ports
   sudo firewall-cmd --permanent --add-port=80/tcp
   sudo firewall-cmd --permanent --add-port=443/tcp
   sudo firewall-cmd --reload
   ```

4. **Check Caddy logs:**
   ```bash
   docker-compose -f docker-compose.production.yml logs caddy
   ```

5. **Hit rate limit? Use staging environment:**

   Edit `Caddyfile`, uncomment staging line:
   ```
   acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
   ```

   Restart Caddy:
   ```bash
   docker-compose -f docker-compose.production.yml restart caddy
   ```

### Issue: WebSocket Connection Fails

**Symptoms:**
- Obsidian interface loads but doesn't update
- Browser console shows WebSocket errors

**Solutions:**

1. **Verify Caddy is proxying correctly:**
   ```bash
   docker-compose -f docker-compose.production.yml exec caddy \
     wget -O- http://obsidian:8080
   ```

2. **Check network connectivity:**
   ```bash
   docker network inspect obsidian_network
   # Both caddy and obsidian should be listed
   ```

3. **Restart services:**
   ```bash
   docker-compose -f docker-compose.production.yml restart
   ```

### Issue: Cannot Access Obsidian

**Symptoms:**
- Connection refused or timeout
- 502 Bad Gateway error

**Solutions:**

1. **Check Obsidian container health:**
   ```bash
   docker-compose -f docker-compose.production.yml ps obsidian
   # Should show "healthy"

   docker-compose -f docker-compose.production.yml logs obsidian
   ```

2. **Verify internal connectivity:**
   ```bash
   docker-compose -f docker-compose.production.yml exec caddy \
     wget -O- http://obsidian:8080
   # Should return HTML content
   ```

3. **Check Obsidian is running:**
   ```bash
   docker exec obsidian-remote ps aux | grep obsidian
   # Should show multiple obsidian processes
   ```

### Issue: Performance Problems

**Symptoms:**
- Slow loading
- Lag in Obsidian interface

**Solutions:**

1. **Increase server resources:**
   - Add more RAM (minimum 2GB)
   - Ensure adequate CPU allocation

2. **Check disk I/O:**
   ```bash
   iostat -x 1
   ```

3. **Monitor container resources:**
   ```bash
   docker stats
   ```

4. **Optimize Caddy:**

   Add to Caddyfile under reverse_proxy:
   ```
   flush_interval -1
   ```

### Getting Help

If issues persist:

1. **Check GitHub Issues:**
   https://github.com/sytone/obsidian-remote/issues

2. **Caddy Community Forum:**
   https://caddy.community/

3. **Collect diagnostic information:**
   ```bash
   # System info
   docker version
   docker-compose version
   uname -a

   # Service status
   docker-compose -f docker-compose.production.yml ps

   # Recent logs
   docker-compose -f docker-compose.production.yml logs --tail=100

   # Network configuration
   docker network inspect obsidian_network
   ```

## Security Recommendations

1. **Enable Authentication:**
   Set `PASSWORD` in `.env` for application-level auth

2. **Firewall Configuration:**
   Only expose ports 80 and 443, block all others

3. **Regular Updates:**
   Keep Docker images updated weekly

4. **Backup Encryption:**
   Encrypt backups of vaults and configuration

5. **Monitor Logs:**
   Regularly review Caddy and Obsidian logs for suspicious activity

6. **Use Strong Passwords:**
   If enabling PASSWORD auth, use strong, unique passwords

## Advanced Configuration

### Custom Caddy Modules

To add Caddy modules (e.g., for CloudFlare DNS challenge):

1. Create custom Dockerfile:
   ```dockerfile
   FROM caddy:2-builder-alpine AS builder
   RUN xcaddy build \
       --with github.com/caddy-dns/cloudflare

   FROM caddy:2-alpine
   COPY --from=builder /usr/bin/caddy /usr/bin/caddy
   ```

2. Build custom image:
   ```bash
   docker build -f Dockerfile.caddy -t caddy-custom .
   ```

3. Update docker-compose.production.yml:
   ```yaml
   caddy:
     image: caddy-custom
   ```

### Multiple Domains

To serve multiple domains, edit Caddyfile:

```
{$DOMAIN1} {
    reverse_proxy obsidian:8080
}

{$DOMAIN2} {
    reverse_proxy other-service:3000
}
```

### Behind NAT/Router

If behind NAT, configure port forwarding:
- External port 80 → Internal IP:80
- External port 443 → Internal IP:443

Ensure router has public IP, not behind carrier-grade NAT (CGNAT).
