import { FastifyInstance } from 'fastify';

/**
 *
 */
export default class DatabaseUtils {
  /**
   * create db connection string from env
   * @param {FastifyInstance} fastify
   * @return {string} connection string
   */
  static getConnectionUrl(fastify: FastifyInstance): string {
    const {
      MONGO_DB_HOST, MONGO_DB_PORT, MONGO_DB_DATABASE, MONGO_DB_USER, MONGO_DB_PASSWORD,
    } = process.env;
    const MONGO_DB_CONNECTION_PREFIX: string = (process.env.MONGO_DB_CONNECTION_PREFIX == null ||
      process.env.MONGO_DB_CONNECTION_PREFIX === undefined) ?
      'mongodb' :
      process.env.MONGO_DB_CONNECTION_PREFIX;
    let connString = '';
    if (MONGO_DB_CONNECTION_PREFIX.toLowerCase() === 'mongodb') {
      connString = `mongodb://${MONGO_DB_USER}:${MONGO_DB_PASSWORD}@${MONGO_DB_HOST}:${MONGO_DB_PORT}/${MONGO_DB_DATABASE}?ssl=true&replicaSet=globaldb&retrywrites=false`;
    } else {
      connString = `mongodb+srv://${MONGO_DB_USER}:${MONGO_DB_PASSWORD}@${MONGO_DB_HOST}/${MONGO_DB_DATABASE}?connectTimeoutMS=10000`;
    }
    fastify.log.debug(`Connection string ${connString}`);
    return connString;
  }
}
