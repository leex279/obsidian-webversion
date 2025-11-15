const validators = require('../utils/validators');

async function validateRoutes(fastify, options) {
  // POST /api/validate/basic - Validate basic settings
  fastify.post('/basic', async (request, reply) => {
    const { puid, pgid, tz, customPort } = request.body;
    const allErrors = [];
    const allWarnings = [];

    const puidResult = validators.validateUID(puid, 'PUID');
    allErrors.push(...puidResult.errors);
    allWarnings.push(...puidResult.warnings);

    const pgidResult = validators.validateUID(pgid, 'PGID');
    allErrors.push(...pgidResult.errors);
    allWarnings.push(...pgidResult.warnings);

    const tzResult = validators.validateTimezone(tz);
    allErrors.push(...tzResult.errors);
    allWarnings.push(...tzResult.warnings);

    if (customPort) {
      const portResult = validators.validatePort(customPort, 'CUSTOM_PORT');
      allErrors.push(...portResult.errors);
      allWarnings.push(...portResult.warnings);
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  });

  // POST /api/validate/domain - Validate domain and DNS
  fastify.post('/domain', async (request, reply) => {
    const { domain, email } = request.body;
    const allErrors = [];
    const allWarnings = [];

    const domainResult = validators.validateDomain(domain);
    allErrors.push(...domainResult.errors);
    allWarnings.push(...domainResult.warnings);

    if (domainResult.valid) {
      const dnsResult = await validators.validateDNS(domain);
      allErrors.push(...dnsResult.errors);
      allWarnings.push(...dnsResult.warnings);
    }

    const emailResult = validators.validateEmail(email, 'CADDY_EMAIL');
    allErrors.push(...emailResult.errors);
    allWarnings.push(...emailResult.warnings);

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  });

  // POST /api/validate/auth - Validate authentication configuration
  fastify.post('/auth', async (request, reply) => {
    const {
      issuerURL,
      clientId,
      clientSecret,
      cookieSecret,
      redirectURL,
      cookieSecure,
      emailDomains
    } = request.body;

    const allErrors = [];
    const allWarnings = [];

    if (issuerURL) {
      const issuerResult = await validators.validateOIDCIssuer(issuerURL);
      allErrors.push(...issuerResult.errors);
      allWarnings.push(...issuerResult.warnings);
    } else {
      allErrors.push({
        field: 'AUTH_OIDC_ISSUER_URL',
        message: 'OIDC issuer URL is required',
        severity: 'error'
      });
    }

    if (!clientId) {
      allErrors.push({
        field: 'AUTH_CLIENT_ID',
        message: 'Client ID is required',
        severity: 'error'
      });
    }

    if (!clientSecret) {
      allErrors.push({
        field: 'AUTH_CLIENT_SECRET',
        message: 'Client secret is required',
        severity: 'error'
      });
    }

    const cookieResult = validators.validateCookieSecret(cookieSecret);
    allErrors.push(...cookieResult.errors);
    allWarnings.push(...cookieResult.warnings);

    const redirectResult = validators.validateRedirectURL(redirectURL, cookieSecure);
    allErrors.push(...redirectResult.errors);
    allWarnings.push(...redirectResult.warnings);

    const domainsResult = validators.validateEmailDomains(emailDomains);
    allErrors.push(...domainsResult.errors);
    allWarnings.push(...domainsResult.warnings);

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  });
}

module.exports = validateRoutes;
