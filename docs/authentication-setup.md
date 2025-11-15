# Authentication Setup Guide - Obsidian Remote

This guide covers setting up production-ready authentication for Obsidian Remote using OAuth2-Proxy and Supabase Auth (or other OIDC providers).

## Why Authentication?

The default HTTP Basic Auth provided by KasmVNC is insufficient for protecting sensitive personal data. According to LinuxServer.io:

> "This authentication mechanism should be used to keep the kids out not the internet."

This authentication layer provides:

- **OAuth2/OIDC standard authentication** - Industry-standard security
- **Session management** - Secure cookie-based sessions
- **Multi-Factor Authentication (MFA)** - Via your identity provider
- **Single Sign-On (SSO)** - Use existing accounts
- **Audit logging** - Track authentication events
- **Provider flexibility** - Easily switch between providers

## Prerequisites

Before setting up authentication, ensure you have:

### 1. Running Obsidian Remote Instance

- Working production deployment with Caddy reverse proxy
- Custom domain with HTTPS configured
- See production deployment documentation

### 2. Identity Provider

Choose one of:

- **Supabase** (Recommended for beginners)
  - Supabase Cloud account OR self-hosted instance
  - See [Supabase Auth Provider Setup](providers/supabase-auth.md)

- **Google OAuth2**
  - Google Cloud Console account
  
- **GitHub OAuth2**
  - GitHub account with OAuth App registered

- **Custom OIDC Provider** (Keycloak, Authelia, Authentik, etc.)
  - See [Generic OAuth2/OIDC Setup](providers/generic-oauth2.md)

### 3. Technical Requirements

- Docker and Docker Compose installed
- Text editor for configuration files
- Terminal access to server

## Architecture Overview

```
Internet → Caddy (HTTPS/443) → OAuth2-Proxy (Auth) → Obsidian (8080)
```

**Flow:**
1. User accesses `https://obsidian.example.com`
2. Caddy proxies to OAuth2-Proxy
3. OAuth2-Proxy checks for valid session cookie
4. If no valid session: redirect to identity provider login
5. After successful login: redirect back with authorization code
6. OAuth2-Proxy exchanges code for token, sets session cookie
7. Subsequent requests are validated via cookie, proxied to Obsidian

## Quick Start

### Step 1: Generate Cookie Secret

```bash
./scripts/generate-cookie-secret.sh
```

Copy the generated secret.

### Step 2: Configure Environment

Create `.env` file with authentication settings:

```bash
# Copy template
cp .env.auth.example .env

# Edit configuration
nano .env
```

Add your configuration:

```bash
DOMAIN=obsidian.example.com
CADDY_EMAIL=admin@example.com

# Obsidian settings
PUID=1000
PGID=1000
TZ=Etc/UTC

# Authentication (example for Supabase)
AUTH_OIDC_ISSUER_URL=https://your-project.supabase.co/auth/v1
AUTH_CLIENT_ID=your-client-id
AUTH_CLIENT_SECRET=your-client-secret
AUTH_COOKIE_SECRET=your-generated-cookie-secret

# Access control
AUTH_EMAIL_DOMAINS=*
```

### Step 3: Validate Configuration

```bash
./scripts/validate-auth-config.sh
```

Ensure all checks pass.

### Step 4: Deploy

```bash
# Start production stack with authentication
docker-compose -f docker-compose.production.yml up -d

# Monitor logs
docker-compose -f docker-compose.production.yml logs -f
```

### Step 5: Test

1. Access `https://obsidian.example.com`
2. Should redirect to identity provider login
3. Login with credentials
4. Should redirect back to Obsidian

## Troubleshooting

### "Invalid redirect URI" error

**Solution**: Add redirect URI in provider settings:
```
https://your-domain.com/oauth2/callback
```

### "Failed to obtain OIDC configuration" error

**Solution**: For Supabase, add manual endpoint configuration in docker-compose.production.yml:
```yaml
- --oidc-jwks-url=${AUTH_OIDC_ISSUER_URL}/.well-known/jwks.json
```

### Login succeeds but blank page

**Solution**: Check Obsidian container health:
```bash
docker-compose -f docker-compose.production.yml ps obsidian
docker-compose -f docker-compose.production.yml logs oauth2-proxy
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use HTTPS only** in production
3. **Enable MFA** in identity provider
4. **Restrict access** by email domain or specific users
5. **Monitor logs** regularly

## Advanced Configuration

### Restrict by Email Domain

```bash
AUTH_EMAIL_DOMAINS=company.com,partner.com
```

### Restrict by Specific Users

```bash
AUTH_ALLOWED_USERS=alice@example.com,bob@example.com
```

## Next Steps

- [Supabase Auth Configuration](providers/supabase-auth.md)
- [Generic OAuth2 Configuration](providers/generic-oauth2.md)
