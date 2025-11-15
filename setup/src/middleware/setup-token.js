const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

async function setupTokenMiddleware(fastify, options) {
  const tokenFile = '/workspace/.setup-token';
  const disableFile = '/workspace/.setup-complete';

  // Check if setup is disabled
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await fs.access(disableFile);
      // Setup is complete - wizard disabled
      return reply.status(403).send({
        success: false,
        message: 'Setup wizard is disabled. Delete .setup-complete file to re-enable.'
      });
    } catch {
      // File doesn't exist - setup still available
    }
  });

  // Token validation
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip token check for health endpoint
    if (request.url.startsWith('/api/health')) {
      return;
    }

    let token = process.env.SETUP_TOKEN;

    // If no token set, generate and save one
    if (!token) {
      try {
        const savedToken = await fs.readFile(tokenFile, 'utf-8');
        token = savedToken.trim();
      } catch {
        // Generate new token
        token = crypto.randomBytes(32).toString('hex');
        await fs.writeFile(tokenFile, token, 'utf-8');
        fastify.log.info(`Generated setup token: ${token}`);
        fastify.log.info('Access setup wizard at: /setup?token=' + token);
      }
    }

    // Validate token from query or header
    const providedToken = request.query.token || request.headers['x-setup-token'];

    if (providedToken !== token) {
      return reply.status(401).send({
        success: false,
        message: 'Invalid setup token. Check docker logs for token.'
      });
    }
  });
}

module.exports = setupTokenMiddleware;
