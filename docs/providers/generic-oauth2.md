# Generic OAuth2/OIDC Provider Configuration

This guide covers configuring any OAuth2 or OpenID Connect (OIDC) compatible identity provider with Obsidian Remote.

## Supported Providers

Any provider implementing OAuth2 or OIDC standard works with OAuth2-Proxy:

### Self-Hosted Open Source
- **Authelia** - Lightweight SSO with MFA
- **Authentik** - Full-featured identity provider
- **Keycloak** - Enterprise identity and access management
- **Ory Hydra** - OAuth2 and OIDC certified server

### Cloud Providers
- **Google** - Google accounts
- **GitHub** - GitHub accounts
- **GitLab** - GitLab accounts
- **Microsoft** - Azure AD / Microsoft accounts
- **Okta** - Enterprise identity platform
- **Auth0** - Developer-focused identity platform

## Prerequisites

- Running identity provider (self-hosted or cloud)
- Admin access to create OAuth2 applications
- OIDC discovery endpoint OR manual endpoint configuration

## General Configuration

### Step 1: Create OAuth2 Application

In your provider's admin panel:

1. **Navigate to OAuth2/OIDC Applications**
   - Authelia: Configuration file
   - Authentik: Applications → Create
   - Keycloak: Clients → Create
   - Google: Cloud Console → Credentials
   - GitHub: Developer settings → OAuth Apps

2. **Create application** with:
   - **Name**: Obsidian Remote
   - **Redirect URI**: `https://obsidian.example.com/oauth2/callback`
   - **Grant Type**: Authorization Code
   - **Scopes**: `openid email profile`

3. **Copy**:
   - Client ID
   - Client Secret
   - Issuer URL

### Step 2: Configure Environment

#### Option A: OIDC Auto-Discovery

```bash
AUTH_OIDC_ISSUER_URL=https://your-provider.com
AUTH_CLIENT_ID=your-client-id
AUTH_CLIENT_SECRET=your-client-secret
```

#### Option B: Manual Endpoints

If auto-discovery fails, add to docker-compose.production.yml:

```yaml
command:
  - --login-url=https://provider.com/oauth2/authorize
  - --redeem-url=https://provider.com/oauth2/token
  - --oidc-jwks-url=https://provider.com/oauth2/keys
```

### Step 3: Test

```bash
docker-compose -f docker-compose.production.yml up -d
# Access your domain - should redirect to provider login
```

## Provider Examples

### Google

Create OAuth2 credentials in [Google Cloud Console](https://console.cloud.google.com):

1. APIs & Services → Credentials
2. Create OAuth client ID
3. Application type: Web application
4. Authorized redirect: `https://obsidian.example.com/oauth2/callback`

```bash
AUTH_OIDC_ISSUER_URL=https://accounts.google.com
AUTH_CLIENT_ID=your-id.apps.googleusercontent.com
AUTH_CLIENT_SECRET=your-secret
```

### GitHub

Create OAuth App in GitHub Settings:

1. Developer settings → OAuth Apps → New
2. Homepage: `https://obsidian.example.com`
3. Callback: `https://obsidian.example.com/oauth2/callback`

Use dedicated GitHub provider:

```yaml
# In docker-compose.production.yml
command:
  - --provider=github
  - --client-id=${AUTH_CLIENT_ID}
  - --client-secret=${AUTH_CLIENT_SECRET}
```

### Keycloak

1. Create client in Keycloak realm
2. Access Type: confidential
3. Valid Redirect URIs: `https://obsidian.example.com/oauth2/callback`

```bash
AUTH_OIDC_ISSUER_URL=https://keycloak.example.com/realms/your-realm
AUTH_CLIENT_ID=obsidian-remote
AUTH_CLIENT_SECRET=your-secret
```

## Troubleshooting

### "OIDC discovery failed"

**Solution**: Use manual endpoint configuration

```yaml
- --skip-oidc-discovery=true
- --login-url=https://provider.com/authorize
- --redeem-url=https://provider.com/token
- --oidc-jwks-url=https://provider.com/jwks
```

### "Invalid scope"

**Solution**: Check provider's supported scopes

```yaml
- --scope=openid email profile
```

### "Redirect URI mismatch"

**Solution**: Ensure exact match in provider settings
- `https://obsidian.example.com/oauth2/callback`
- No trailing slashes
- HTTPS must match

## Security

1. **Use HTTPS only** in production
2. **Keep secrets secure** - never commit to git
3. **Enable MFA** in identity provider
4. **Rotate secrets** periodically
5. **Monitor logs** for authentication events

## Advanced

### Restrict by Email Domain

```yaml
- --email-domain=company.com
```

### Restrict by Users

```yaml
- --authenticated-emails-file=/config/allowed-users.txt
```

Create `/config/allowed-users.txt`:
```
alice@example.com
bob@example.com
```

### Custom Headers

```yaml
- --set-xauthrequest=true
- --pass-user-headers=true
```

## Next Steps

- [Supabase Auth](supabase-auth.md)
- [Authentication Setup](../authentication-setup.md)
