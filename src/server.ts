import dotenv from 'dotenv';
import fastify, { FastifyInstance } from 'fastify';
import pino from 'pino';
import UserIndex from './modules/users/user-index';
import DatabaseUtils from './utils/database-utils';

/**
 * Initialize Fastify server
 */
async function initializeServer() {
  try {
    console.log('Initializing server...');
    dotenv.config();
    const server: FastifyInstance = fastify({
      pluginTimeout: 10000,
      logger: pino({
        level: 'debug',
        messageKey: 'message',
      }),
    });

    await server.register(require('fastify-mongodb'), {
      // force to close the mongodb connection when app stopped
      // the default value is false
      forceClose: false,
      url: DatabaseUtils.getConnectionUrl(server),
    });

    // Cors
    server.register(require('fastify-cors'), {
      origin: '*',
      allowedHeaders: [ 'Origin', 'X-Requested-With', 'Accept', 'Content-Type', 'Authorization', 'link', 'total' ],
      methods: [ 'GET', 'PUT', 'PATCH', 'POST', 'DELETE' ],
    });
    // Swaggerify
    // server.register(require('fastify-swagger'), swaggerOptions);
    // ServerUtils.registerRoutes(server);

    const port = Number.parseInt(process.env.PORT === undefined ? '5000' : process.env.PORT, 10);
    const host = process.env.HOST === undefined ? 'localhost' : process.env.HOST;

    const users = new UserIndex(server);
    users.register();

    server.listen(port, host, (err: Error, address: string) => {
      if (err) {
        process.exit(1);
      }
      // server.swagger();
      server.log.debug(`Server listening at ${address}`);
    });
  } catch (e) {
    console.error(e);
    // console.fatal(e);
  }
}

initializeServer();
