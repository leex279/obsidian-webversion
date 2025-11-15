const dns = require('dns').promises;
const https = require('https');

/**
 * Validate PUID/PGID (must be positive integer)
 */
function validateUID(value, fieldName = 'UID') {
  const errors = [];
  const warnings = [];

  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0 || num > 65535) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a number between 0 and 65535`,
      severity: 'error'
    });
  }

  if (num === 0) {
    warnings.push({
      field: fieldName,
      message: `${fieldName}=0 means root user - not recommended for security`,
      severity: 'warning'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate timezone (must be valid TZ database name)
 */
function validateTimezone(tz) {
  const errors = [];
  const warnings = [];

  // Basic format check
  if (!tz || typeof tz !== 'string') {
    errors.push({
      field: 'TZ',
      message: 'Timezone is required',
      severity: 'error'
    });
  } else if (tz === 'Etc/UTC') {
    warnings.push({
      field: 'TZ',
      message: 'Using UTC timezone - consider setting your local timezone',
      severity: 'warning'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate port number (1-65535, avoid reserved ports)
 */
function validatePort(port, fieldName = 'PORT') {
  const errors = [];
  const warnings = [];

  const num = parseInt(port, 10);
  if (isNaN(num) || num < 1 || num > 65535) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be between 1 and 65535`,
      severity: 'error'
    });
  }

  if (num < 1024 && num !== 80 && num !== 443) {
    warnings.push({
      field: fieldName,
      message: `Port ${num} is in reserved range (1-1023) - may require root privileges`,
      severity: 'warning'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate domain name format
 */
function validateDomain(domain) {
  const errors = [];
  const warnings = [];

  if (!domain || typeof domain !== 'string') {
    errors.push({
      field: 'DOMAIN',
      message: 'Domain is required',
      severity: 'error'
    });
    return { valid: false, errors, warnings };
  }

  // Basic domain format validation
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  if (!domainRegex.test(domain)) {
    errors.push({
      field: 'DOMAIN',
      message: 'Invalid domain format (e.g., obsidian.example.com)',
      severity: 'error'
    });
  }

  if (domain.endsWith('.local') || domain.endsWith('.localhost')) {
    warnings.push({
      field: 'DOMAIN',
      message: 'Local domains (.local, .localhost) cannot get SSL certificates from Let\'s Encrypt',
      severity: 'warning'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate DNS records for domain (A or AAAA record exists)
 */
async function validateDNS(domain) {
  const errors = [];
  const warnings = [];

  try {
    // Try to resolve A record
    const addresses = await dns.resolve4(domain).catch(() => []);

    if (addresses.length === 0) {
      // Try AAAA record
      const ipv6Addresses = await dns.resolve6(domain).catch(() => []);

      if (ipv6Addresses.length === 0) {
        errors.push({
          field: 'DOMAIN',
          message: `No DNS records found for ${domain} - add A or AAAA record pointing to your server`,
          severity: 'error'
        });
      }
    }
  } catch (error) {
    errors.push({
      field: 'DOMAIN',
      message: `DNS lookup failed: ${error.message}`,
      severity: 'error'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate email format
 */
function validateEmail(email, fieldName = 'EMAIL') {
  const errors = [];
  const warnings = [];

  if (!email || typeof email !== 'string') {
    errors.push({
      field: fieldName,
      message: 'Email is required',
      severity: 'error'
    });
    return { valid: false, errors, warnings };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push({
      field: fieldName,
      message: 'Invalid email format',
      severity: 'error'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate OAuth2 redirect URL format
 */
function validateRedirectURL(url, cookieSecure) {
  const errors = [];
  const warnings = [];

  if (!url || typeof url !== 'string') {
    errors.push({
      field: 'AUTH_REDIRECT_URL',
      message: 'OAuth2 redirect URL is required',
      severity: 'error'
    });
    return { valid: false, errors, warnings };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    errors.push({
      field: 'AUTH_REDIRECT_URL',
      message: 'Redirect URL must start with http:// or https://',
      severity: 'error'
    });
  }

  if (!url.endsWith('/oauth2/callback')) {
    warnings.push({
      field: 'AUTH_REDIRECT_URL',
      message: 'Redirect URL should end with /oauth2/callback',
      severity: 'warning'
    });
  }

  if (url.startsWith('http://') && cookieSecure !== 'false') {
    warnings.push({
      field: 'AUTH_REDIRECT_URL',
      message: 'HTTP redirect URL requires AUTH_COOKIE_SECURE=false',
      severity: 'warning'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate cookie secret (must be 32+ characters)
 */
function validateCookieSecret(secret) {
  const errors = [];
  const warnings = [];

  if (!secret || typeof secret !== 'string') {
    errors.push({
      field: 'AUTH_COOKIE_SECRET',
      message: 'Cookie secret is required',
      severity: 'error'
    });
    return { valid: false, errors, warnings };
  }

  if (secret.length < 32) {
    errors.push({
      field: 'AUTH_COOKIE_SECRET',
      message: `Cookie secret must be at least 32 characters (got ${secret.length})`,
      severity: 'error'
    });
  }

  // Check if it's base64-encoded (recommended)
  const base64Regex = /^[A-Za-z0-9+/=_-]+$/;
  if (!base64Regex.test(secret)) {
    warnings.push({
      field: 'AUTH_COOKIE_SECRET',
      message: 'Cookie secret should be base64-encoded for security',
      severity: 'warning'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate email domains restriction
 */
function validateEmailDomains(domains) {
  const errors = [];
  const warnings = [];

  if (!domains || typeof domains !== 'string') {
    errors.push({
      field: 'AUTH_EMAIL_DOMAINS',
      message: 'Email domains restriction is required',
      severity: 'error'
    });
    return { valid: false, errors, warnings };
  }

  if (domains === '*') {
    warnings.push({
      field: 'AUTH_EMAIL_DOMAINS',
      message: 'Wildcard (*) allows ANY email domain - not recommended for production',
      severity: 'warning'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate OIDC issuer URL (check if reachable)
 */
async function validateOIDCIssuer(issuerURL) {
  const errors = [];
  const warnings = [];

  if (!issuerURL || typeof issuerURL !== 'string') {
    errors.push({
      field: 'AUTH_OIDC_ISSUER_URL',
      message: 'OIDC issuer URL is required',
      severity: 'error'
    });
    return { valid: false, errors, warnings };
  }

  if (!issuerURL.startsWith('https://') && !issuerURL.startsWith('http://')) {
    errors.push({
      field: 'AUTH_OIDC_ISSUER_URL',
      message: 'OIDC issuer URL must start with http:// or https://',
      severity: 'error'
    });
    return { valid: false, errors, warnings };
  }

  // Try to fetch JWKS endpoint
  const jwksURL = `${issuerURL}/.well-known/jwks.json`;

  return new Promise((resolve) => {
    const request = https.get(jwksURL, { timeout: 5000 }, (response) => {
      if (response.statusCode === 200) {
        // JWKS endpoint exists
        resolve({ valid: true, errors, warnings });
      } else if (response.statusCode === 404) {
        warnings.push({
          field: 'AUTH_OIDC_ISSUER_URL',
          message: 'JWKS endpoint not found - manual OIDC configuration may be required',
          severity: 'warning'
        });
        resolve({ valid: true, errors, warnings });
      } else {
        errors.push({
          field: 'AUTH_OIDC_ISSUER_URL',
          message: `OIDC endpoint returned status ${response.statusCode}`,
          severity: 'error'
        });
        resolve({ valid: false, errors, warnings });
      }
    });

    request.on('error', (error) => {
      errors.push({
        field: 'AUTH_OIDC_ISSUER_URL',
        message: `Cannot reach OIDC issuer: ${error.message}`,
        severity: 'error'
      });
      resolve({ valid: false, errors, warnings });
    });

    request.on('timeout', () => {
      errors.push({
        field: 'AUTH_OIDC_ISSUER_URL',
        message: 'OIDC issuer timeout - check URL and network connectivity',
        severity: 'error'
      });
      request.destroy();
      resolve({ valid: false, errors, warnings });
    });
  });
}

module.exports = {
  validateUID,
  validateTimezone,
  validatePort,
  validateDomain,
  validateDNS,
  validateEmail,
  validateRedirectURL,
  validateCookieSecret,
  validateEmailDomains,
  validateOIDCIssuer
};
