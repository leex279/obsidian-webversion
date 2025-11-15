const dockerCli = require('../utils/docker-cli');

async function deployRoutes(fastify, options) {
  // POST /api/deploy/build - Build Docker images
  fastify.post('/build', async (request, reply) => {
    const { composeFile } = request.body;

    try {
      const result = await dockerCli.buildServices(composeFile || 'docker-compose.production.yml');

      return {
        success: result.success,
        message: result.success ? 'Build completed successfully' : 'Build failed',
        logs: result.stdout,
        errors: result.stderr
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: `Build error: ${error.message}`
      });
    }
  });

  // POST /api/deploy/start - Start services
  fastify.post('/start', async (request, reply) => {
    const { composeFile, profiles } = request.body;

    try {
      const result = await dockerCli.startServices(
        composeFile || 'docker-compose.production.yml',
        profiles
      );

      return {
        success: result.success,
        message: result.success ? 'Services started successfully' : 'Failed to start services',
        logs: result.stdout,
        errors: result.stderr
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: `Start error: ${error.message}`
      });
    }
  });

  // GET /api/deploy/status - Get service status
  fastify.get('/status', async (request, reply) => {
    const { composeFile } = request.query;

    try {
      const status = await dockerCli.getServiceStatus(composeFile || 'docker-compose.production.yml');

      return {
        success: true,
        data: status
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: `Status check error: ${error.message}`
      });
    }
  });

  // GET /api/deploy/logs/:service? - Get service logs
  fastify.get('/logs/:service?', async (request, reply) => {
    const { service } = request.params;
    const { composeFile, tail } = request.query;

    try {
      const result = await dockerCli.getServiceLogs(
        composeFile || 'docker-compose.production.yml',
        service,
        parseInt(tail) || 50
      );

      return {
        success: result.success,
        logs: result.stdout,
        errors: result.stderr
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: `Log retrieval error: ${error.message}`
      });
    }
  });
}

module.exports = deployRoutes;
