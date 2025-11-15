const envParser = require('../utils/env-parser');
const path = require('path');

async function configRoutes(fastify, options) {
  const workspaceDir = process.env.WORKSPACE_DIR || '/workspace';

  // GET /api/config - Get current configuration
  fastify.get('/', async (request, reply) => {
    try {
      const envPath = path.join(workspaceDir, '.env');
      const config = await envParser.parseEnvFile(envPath);

      return {
        success: true,
        data: config,
        message: 'Configuration loaded successfully'
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: `Failed to load configuration: ${error.message}`
      });
    }
  });

  // GET /api/config/templates/:templateName
  fastify.get('/templates/:templateName', async (request, reply) => {
    try {
      const { templateName } = request.params;
      const template = await envParser.loadTemplate(templateName);

      return {
        success: true,
        data: template,
        message: `Template ${templateName} loaded`
      };
    } catch (error) {
      return reply.status(404).send({
        success: false,
        message: `Template not found: ${error.message}`
      });
    }
  });

  // POST /api/config - Save configuration
  fastify.post('/', async (request, reply) => {
    try {
      const { config, deploymentType } = request.body;

      if (!config || !deploymentType) {
        return reply.status(400).send({
          success: false,
          message: 'Config and deploymentType are required'
        });
      }

      const envPath = path.join(workspaceDir, '.env');
      await envParser.writeEnvFile(envPath, config, deploymentType);

      return {
        success: true,
        message: 'Configuration saved successfully'
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: `Failed to save configuration: ${error.message}`
      });
    }
  });
}

module.exports = configRoutes;
