const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Execute docker-compose command safely
 * SECURITY: Only allows specific whitelisted commands
 */
async function executeDockerCompose(command, composeFile = 'docker-compose.yml') {
  const workspaceDir = process.env.WORKSPACE_DIR || '/workspace';

  // Whitelist of allowed commands
  const allowedCommands = ['config', 'ps', 'up', 'down', 'logs', 'build'];

  // Extract base command (first word)
  const baseCommand = command.split(' ')[0];

  if (!allowedCommands.includes(baseCommand)) {
    throw new Error(`Docker compose command "${baseCommand}" is not allowed for security reasons`);
  }

  // Validate compose file name (prevent path traversal)
  const allowedFiles = [
    'docker-compose.yml',
    'docker-compose.production.yml',
    'docker-compose.auth.yml',
    'docker-compose.sync-syncthing.yml',
    'docker-compose.sync-rclone.yml'
  ];

  if (!allowedFiles.includes(composeFile)) {
    throw new Error(`Compose file "${composeFile}" is not allowed`);
  }

  const fullCommand = `cd ${workspaceDir} && docker compose -f ${composeFile} ${command}`;

  // Set timeout based on command type
  // Build commands can take 5-10 minutes (downloading images, building)
  // Other commands are quick
  const timeout = baseCommand === 'build' ? 600000 : 120000; // 10 min for build, 2 min for others

  try {
    const { stdout, stderr } = await execPromise(fullCommand, {
      timeout: timeout,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for build logs
    });

    return {
      success: true,
      stdout,
      stderr,
      command: fullCommand
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      command: fullCommand
    };
  }
}

/**
 * Validate docker-compose file syntax
 */
async function validateComposeFile(composeFile) {
  const result = await executeDockerCompose('config', composeFile);
  return result.success;
}

/**
 * Check if services are running
 */
async function getServiceStatus(composeFile) {
  const result = await executeDockerCompose('ps', composeFile);

  if (!result.success) {
    return { running: false, services: [] };
  }

  // Parse ps output (basic parsing)
  const lines = result.stdout.split('\n').filter(line => line.trim());
  const services = [];

  // Skip header lines
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('Up')) {
      const match = line.match(/^([^\s]+)/);
      if (match) {
        services.push(match[1]);
      }
    }
  }

  return {
    running: services.length > 0,
    services
  };
}

/**
 * Start services (docker-compose up -d)
 */
async function startServices(composeFile) {
  return await executeDockerCompose('up -d', composeFile);
}

/**
 * Stop services (docker-compose down)
 */
async function stopServices(composeFile) {
  return await executeDockerCompose('down', composeFile);
}

/**
 * Get service logs (last 50 lines)
 */
async function getServiceLogs(composeFile, serviceName = '', tail = 50) {
  const command = serviceName
    ? `logs --tail=${tail} ${serviceName}`
    : `logs --tail=${tail}`;

  return await executeDockerCompose(command, composeFile);
}

/**
 * Build services
 */
async function buildServices(composeFile) {
  return await executeDockerCompose('build', composeFile);
}

module.exports = {
  executeDockerCompose,
  validateComposeFile,
  getServiceStatus,
  startServices,
  stopServices,
  getServiceLogs,
  buildServices
};
