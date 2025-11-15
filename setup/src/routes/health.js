async function healthRoutes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  });
}

module.exports = healthRoutes;
