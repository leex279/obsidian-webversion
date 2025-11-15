#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Validating Authentication Configuration..."
echo ""

# Load environment file
ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}ERROR: Environment file '$ENV_FILE' not found${NC}"
    echo "Usage: $0 [env-file]"
    exit 1
fi

source "$ENV_FILE"

# Track validation status
ERRORS=0
WARNINGS=0

# Check required variables
check_required() {
    VAR_NAME=$1
    VAR_VALUE=$2

    if [ -z "$VAR_VALUE" ]; then
        echo -e "${RED}✗ $VAR_NAME is not set${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ $VAR_NAME is set${NC}"
    fi
}

# Check optional variables
check_optional() {
    VAR_NAME=$1
    VAR_VALUE=$2
    RECOMMENDATION=$3

    if [ -z "$VAR_VALUE" ]; then
        echo -e "${YELLOW}⚠ $VAR_NAME is not set${NC}"
        echo -e "  ${YELLOW}Recommendation: $RECOMMENDATION${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓ $VAR_NAME is set${NC}"
    fi
}

echo "=== Required Configuration ==="
check_required "DOMAIN" "$DOMAIN"
check_required "CADDY_EMAIL" "$CADDY_EMAIL"
check_required "AUTH_OIDC_ISSUER_URL" "$AUTH_OIDC_ISSUER_URL"
check_required "AUTH_CLIENT_ID" "$AUTH_CLIENT_ID"
check_required "AUTH_CLIENT_SECRET" "$AUTH_CLIENT_SECRET"
check_required "AUTH_COOKIE_SECRET" "$AUTH_COOKIE_SECRET"

echo ""
echo "=== Optional Configuration ==="
check_optional "AUTH_EMAIL_DOMAINS" "$AUTH_EMAIL_DOMAINS" "Set to '*' to allow all domains, or specify comma-separated allowed domains"
check_optional "AUTH_ALLOWED_USERS" "$AUTH_ALLOWED_USERS" "Leave empty to allow all authenticated users, or specify comma-separated email addresses"

# Validate cookie secret length
if [ -n "$AUTH_COOKIE_SECRET" ]; then
    SECRET_LENGTH=$(echo -n "$AUTH_COOKIE_SECRET" | wc -c)
    if [ $SECRET_LENGTH -lt 32 ]; then
        echo -e "${RED}✗ AUTH_COOKIE_SECRET is too short (must be at least 32 characters)${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ AUTH_COOKIE_SECRET length is valid${NC}"
    fi
fi

# Validate OIDC Issuer URL format
if [ -n "$AUTH_OIDC_ISSUER_URL" ]; then
    if [[ ! "$AUTH_OIDC_ISSUER_URL" =~ ^https?:// ]]; then
        echo -e "${RED}✗ AUTH_OIDC_ISSUER_URL must start with http:// or https://${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ AUTH_OIDC_ISSUER_URL format is valid${NC}"
    fi
fi

# Test OIDC endpoint connectivity (optional)
if [ -n "$AUTH_OIDC_ISSUER_URL" ]; then
    echo ""
    echo "=== Testing OIDC Connectivity ==="
    JWKS_URL="${AUTH_OIDC_ISSUER_URL}/.well-known/jwks.json"

    if curl -f -s -o /dev/null "$JWKS_URL"; then
        echo -e "${GREEN}✓ OIDC JWKS endpoint is reachable${NC}"
    else
        echo -e "${YELLOW}⚠ OIDC JWKS endpoint not reachable at $JWKS_URL${NC}"
        echo -e "  ${YELLOW}This may be normal for Supabase - it may require manual endpoint configuration${NC}"
        ((WARNINGS++))
    fi
fi

# Summary
echo ""
echo "=== Validation Summary ==="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All required configuration is valid${NC}"
else
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $WARNINGS warning(s)${NC}"
fi

echo ""

if [ $ERRORS -gt 0 ]; then
    exit 1
else
    exit 0
fi
