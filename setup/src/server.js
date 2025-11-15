const fastify = require('fastify')({ logger: true });
const path = require('path');
const fastifyStatic = require('@fastify/static');
const fastifyCors = require('@fastify/cors');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Register CORS
fastify.register(fastifyCors, {
  origin: true,
  credentials: true
});

// Serve static files (frontend)
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/'
});

// Register API routes
fastify.register(require('./routes/health'), { prefix: '/api/health' });
fastify.register(require('./routes/config'), { prefix: '/api/config' });
fastify.register(require('./routes/validate'), { prefix: '/api/validate' });
fastify.register(require('./routes/deploy'), { prefix: '/api/deploy' });

// Root route - serve index.html
fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(500).send({
    success: false,
    message: error.message || 'Internal Server Error'
  });
});

// Graceful shutdown
const closeGracefully = async (signal) => {
  fastify.log.info(`Received ${signal}, closing server...`);
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', closeGracefully);
process.on('SIGTERM', closeGracefully);

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Setup wizard running at http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
