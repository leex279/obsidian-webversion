# Setup Wizard Quick Start

## ⚠️ Important: Two Different Approaches

The setup wizard can be run in two different ways. Choose based on your needs:

### 🎯 For First-Time Setup (RECOMMENDED)

Use the standalone setup compose file:

```bash
# Start setup wizard ONLY (no other services)
docker-compose -f docker-compose.setup.yml up -d

# Access at http://localhost:3000
# Follow the 5-step wizard
# Click "Deploy" to start all services

# After successful deployment, stop the wizard
docker-compose -f docker-compose.setup.yml down
```

**Why this way?**
- ✅ Wizard starts alone, no other services
- ✅ You configure BEFORE deploying
- ✅ Wizard deploys the right services based on your choices
- ✅ Clean separation of setup vs production

### 🏭 For Production Stack (Advanced)

Use the production compose file with setup profile:

```bash
# Start setup wizard as part of production stack
docker-compose -f docker-compose.production.yml --profile setup up -d

# Access at http://localhost:3000 (or https://your-domain.com/setup via Caddy)
# Follow the 5-step wizard
# Click "Deploy"

# After setup, the wizard stops automatically
```

**Why this way?**
- ✅ Integrated with full production stack
- ✅ Setup wizard accessible via Caddy reverse proxy
- ✅ Can be re-run later if needed (with `--profile setup`)

## ❌ What NOT To Do

**Don't run this:**
```bash
# ❌ WRONG - This starts ALL services including Obsidian before configuration
docker-compose -f docker-compose.production.yml up -d setup-wizard
```

**Problem:** Without the `--profile setup` flag, Docker Compose tries to satisfy all dependencies, which means it starts Obsidian and other services BEFORE you've configured them.

## Correct Commands Summary

| Scenario | Command |
|----------|---------|
| **First-time setup** | `docker-compose -f docker-compose.setup.yml up -d` |
| **Production setup** | `docker-compose -f docker-compose.production.yml --profile setup up -d` |
| **Re-run setup** | Same as above, after deleting `.setup-complete` file |
| **Stop wizard** | `docker-compose -f docker-compose.setup.yml down` |

## Access URLs

- **Standalone**: http://localhost:3000
- **Via Caddy**: https://your-domain.com/setup (after Caddy is running)

## After Setup

Once setup is complete:

1. The wizard creates `.setup-complete` file and disables itself
2. Your services are running (Obsidian, Caddy, OAuth2-Proxy if configured)
3. Access Obsidian at your configured URL

To reconfigure later:
```bash
rm .setup-complete
docker-compose -f docker-compose.setup.yml up -d
```

## See Full Documentation

For detailed documentation, see [docs/setup-wizard-guide.md](docs/setup-wizard-guide.md)
