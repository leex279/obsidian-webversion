# Web Setup Wizard Guide

Obsidian Remote includes an interactive web-based setup wizard that guides you through the complete configuration process.

## Quick Start

There are two ways to use the setup wizard:

### Option 1: Standalone Setup (Recommended for First-Time Setup)

1. **Start the setup wizard alone**:
   ```bash
   docker-compose -f docker-compose.setup.yml up -d
   ```

2. **Access the wizard** in browser:
   ```
   http://localhost:3000
   ```

   Note: No token required when using docker-compose.setup.yml

3. **Follow the wizard** through 5 steps to configure your deployment

4. **Deploy** - Wizard will automatically start all services via Docker Compose

5. **Stop the wizard** (after successful deployment):
   ```bash
   docker-compose -f docker-compose.setup.yml down
   ```

### Option 2: Integrated Setup (For Production Stack)

1. **Start the setup wizard with production profile**:
   ```bash
   docker-compose -f docker-compose.production.yml --profile setup up -d
   ```

   Note: This starts ONLY the setup wizard, not the other services

2. **Access the wizard** in browser:
   ```
   http://localhost:3000
   ```

3. **Follow the wizard** through 5 steps

4. **Deploy** - Wizard will configure and start all services

5. **Access via Caddy** (after deployment):
   ```
   https://your-domain.com/setup
   ```

## Wizard Steps

### Step 1: Deployment Type

Choose your deployment scenario:

- **Local Development** - Basic configuration for local testing (no domain, no auth)
- **Production (Caddy + SSL)** - Domain with automatic SSL certificates via Let's Encrypt
- **Production + Authentication** - Full production with OAuth2/OIDC authentication layer

### Step 2: Basic Settings

Configure core application settings:

- **PUID/PGID** - User and group IDs for file ownership (run `id -u` and `id -g` to get yours)
- **Timezone** - Your local timezone (e.g., America/New_York, Europe/London)
- **Ports** - HTTP (8080) and HTTPS (8443) ports for internal use

### Step 3: Domain & SSL (Production Deployments Only)

Configure your domain and SSL certificates:

- **Domain** - Your fully qualified domain name (e.g., obsidian.example.com)
  - **DNS Requirement**: Must have an A or AAAA record pointing to your server's public IP
  - **Ports**: Server must be accessible on ports 80 and 443 for Let's Encrypt validation
- **Email** - Email address for Let's Encrypt certificate notifications
- **DNS Validation** - Click "Validate DNS" to verify your domain is properly configured

### Step 4: Authentication (Production + Auth Only)

Configure OAuth2/OIDC authentication:

- **OIDC Issuer URL** - Your OAuth2 provider's issuer URL
  - Examples:
    - Supabase: `https://yourproject.supabase.co/auth/v1`
    - Google: `https://accounts.google.com`
    - Custom: Your OIDC provider's base URL
- **Client ID** - OAuth2 client ID from your provider
- **Client Secret** - OAuth2 client secret from your provider
- **Cookie Secret** - Auto-generated secure random string (click "Generate")
- **Email Domains** - Comma-separated list of allowed email domains (use `*` for any)

**Supported Providers**:
- Supabase Auth
- Google Workspace
- GitHub
- Keycloak
- Any OIDC-compliant provider

### Step 5: Review & Deploy

Review your configuration and deploy:

1. **Review** all settings for accuracy
2. **Click Deploy** to start the deployment process
3. **Monitor logs** in real-time as services build and start
4. **Access your instance** at the URL shown after successful deployment

## Security

### Setup Token

- **Auto-generated** on first run - check Docker logs to retrieve it
- **Required** for all wizard access - prevents unauthorized configuration changes
- **One-time use** recommended - wizard automatically disables after successful setup

### Re-enabling the Wizard

If you need to reconfigure your deployment:

1. Delete the setup completion marker:
   ```bash
   rm .setup-complete
   ```

2. Restart the setup wizard:
   ```bash
   docker-compose -f docker-compose.production.yml restart setup-wizard
   ```

3. Access with the same token (or check logs for new token)

**Warning**: Re-running setup will overwrite your `.env` file. Back up your current configuration first.

## Troubleshooting

### Cannot Access Wizard

**Problem**: Browser shows "Cannot connect" or timeout

**Solutions**:
- Check wizard is running: `docker-compose -f docker-compose.production.yml ps setup-wizard`
- Verify firewall allows port 3000 (or use SSH tunnel)
- Check Docker logs: `docker-compose -f docker-compose.production.yml logs setup-wizard`

### Invalid Token Error

**Problem**: "Invalid setup token" message

**Solutions**:
- Retrieve token from logs: `docker-compose logs setup-wizard | grep token`
- Ensure you're including `?token=YOUR_TOKEN` in the URL
- Restart wizard if token was changed: `docker-compose restart setup-wizard`

### DNS Validation Fails

**Problem**: "No DNS records found" error

**Solutions**:
- Wait 5-10 minutes for DNS propagation after creating A record
- Verify DNS with: `nslookup your-domain.com`
- Check A record points to your server's public IP
- Some DNS providers cache records - try `8.8.8.8` DNS server

### Deployment Fails

**Problem**: Services fail to start or show errors in logs

**Solutions**:
- Check Docker logs for specific service errors
- Verify all required environment variables are set correctly
- Ensure ports 80 and 443 are not already in use
- For OAuth errors, verify client ID and secret are correct

### Wizard Shows "Setup Complete"

**Problem**: Need to access wizard but it's disabled

**Solutions**:
- Remove completion marker: `rm .setup-complete`
- Restart wizard: `docker-compose restart setup-wizard`
- Backup existing config first: `cp .env .env.backup`

## Advanced Usage

### Using Custom Compose Files

The wizard can deploy using custom compose files:

1. Create your custom `docker-compose.custom.yml`
2. Modify `setup/src/utils/docker-cli.js` to whitelist your file
3. Access via API: `POST /api/deploy/start` with `{ "composeFile": "docker-compose.custom.yml" }`

### Headless Setup (API Only)

You can configure and deploy without the web UI using the REST API:

```bash
# Save configuration
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "PUID": "1000",
      "PGID": "1000",
      "TZ": "America/New_York",
      "DOMAIN": "obsidian.example.com"
    },
    "deploymentType": "production"
  }'

# Deploy
curl -X POST http://localhost:3000/api/deploy/start \
  -H "Content-Type: application/json" \
  -d '{ "composeFile": "docker-compose.production.yml" }'
```

### SSH Tunnel for Remote Access

If accessing wizard from a remote machine:

```bash
ssh -L 3000:localhost:3000 user@your-server
```

Then access wizard at: `http://localhost:3000/setup?token=YOUR_TOKEN`

## Next Steps

After successful deployment:

1. **Access Obsidian**: Navigate to your configured URL (http://localhost:8080 or https://your-domain.com)
2. **Configure vaults**: Create or upload your Obsidian vaults to `./vaults` directory
3. **Install plugins**: Use Obsidian's community plugins feature as normal
4. **Set up sync** (optional): Configure Git sync or other sync providers
5. **Disable wizard** (recommended): For production, keep wizard disabled until needed

## Support

For issues not covered in this guide:

- Check [main README](../README.md) for general information
- Review [authentication setup guide](./authentication-setup.md) for auth issues
- Report bugs at: [GitHub Issues](https://github.com/sytone/obsidian-remote/issues)
