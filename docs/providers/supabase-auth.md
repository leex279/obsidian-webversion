# Supabase Auth Provider Configuration

This guide covers configuring Supabase Auth as the identity provider for Obsidian Remote authentication.

## Overview

Supabase provides a complete authentication system (GoTrue) that supports:
- Email/password authentication
- Magic links (passwordless)
- OAuth providers (Google, GitHub, etc.)
- Phone authentication
- Multi-Factor Authentication (MFA)

## Option 1: Supabase Cloud (Recommended)

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: obsidian-auth
   - **Database Password**: (generate strong password)
   - **Region**: Choose closest to your server
4. Click **"Create new project"**
5. Wait for provisioning (~2 minutes)

### Step 2: Get Project Credentials

1. In dashboard, go to **Settings** → **API**
2. Copy **Project URL**: `https://<project-ref>.supabase.co`
3. Copy **anon public** key

### Step 3: Configure Redirect URI

1. Go to **Authentication** → **URL Configuration**
2. Add **Redirect URLs**:
   ```
   https://obsidian.example.com/oauth2/callback
   ```
3. Click **Save**

### Step 4: Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Click **Save**

### Step 5: Configure OAuth2-Proxy

Add to `.env`:

```bash
AUTH_OIDC_ISSUER_URL=https://your-project-ref.supabase.co/auth/v1
AUTH_CLIENT_ID=your-anon-public-key
AUTH_CLIENT_SECRET=your-service-role-secret-key
```

⚠️ **Important**: The `service_role` key has full database access. Only use it in OAuth2-Proxy container.

### Step 6: Test

1. Start Obsidian Remote stack
2. Access `https://obsidian.example.com`
3. Should redirect to Supabase Auth login
4. Create account or log in
5. Should redirect back to Obsidian

## Option 2: Self-Hosted Supabase

### Prerequisites

- Docker and Docker Compose
- At least 4GB RAM
- 20GB disk space

### Step 1: Clone Supabase

```bash
git clone --depth 1 https://github.com/supabase/supabase.git /opt/supabase
cd /opt/supabase/docker
```

### Step 2: Configure Environment

```bash
cp .env.example .env

# Generate JWT secret
cat .env | sed 's/super-secret-jwt-token-with-at-least-32-characters-long/'$(openssl rand -base64 32)'/g' > .env.tmp && mv .env.tmp .env
```

Edit `.env`:

```bash
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-generated-jwt-secret
SITE_URL=https://obsidian.example.com
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your-admin-password

# SMTP for email auth
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
```

### Step 3: Start Supabase

```bash
docker compose up -d
docker compose ps  # All should be "healthy"
```

### Step 4: Configure OAuth2

Access dashboard: `http://your-server-ip:8000`

1. Login with credentials from `.env`
2. Go to **Authentication** → **URL Configuration**
3. Add redirect URL:
   ```
   https://obsidian.example.com/oauth2/callback
   ```

### Step 5: Configure OAuth2-Proxy

Add to Obsidian `.env`:

```bash
AUTH_OIDC_ISSUER_URL=http://your-server-ip:8000/auth/v1
AUTH_CLIENT_ID=your-anon-key-from-supabase-env
AUTH_CLIENT_SECRET=your-service-role-key-from-supabase-env
```

## Troubleshooting

### "JWT verification failed"

**Solution**:
1. Verify JWT_SECRET in Supabase matches token signing
2. Restart Supabase Auth: `docker compose restart auth`
3. Clear browser cookies

### "Redirect URI mismatch"

**Solution**:
1. Check exact match in dashboard
2. Ensure HTTPS vs HTTP matches
3. No trailing slashes

### Users cannot receive email

**Solution** (self-hosted):
1. Configure SMTP in `.env`
2. Or disable confirmation: `GOTRUE_MAILER_AUTOCONFIRM=true`

## Security

- **anon key**: Safe to expose (used client-side)
- **service_role key**: MUST remain secret (full DB access)

For OAuth2-Proxy, we use `service_role` for server-side token validation.

## Next Steps

- [Enable MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [Configure OAuth providers](https://supabase.com/docs/guides/auth/social-login)
- [Customize email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
