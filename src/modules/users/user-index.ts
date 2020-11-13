import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 *
 */
export default class UserIndex {
  /**
   *
   *
   * @protected
   * @type {*}
   * @memberof UserIndex
   */
  protected fastifyInstance: any;

  /**
   * Creates an instance of UserIndex.
   *
   * @param {*} fastify
   * @memberof UserIndex
   */
  constructor(fastify: FastifyInstance) {
    this.fastifyInstance = fastify;
  }

  /**
   *
   *
   * @memberof UserIndex
   */
  public register() {
    const db = this.fastifyInstance.mongo.db;
    const collection = db.collection('users');

    this.fastifyInstance.get('/user', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // FIXME: query not work
        console.log(collection);
        const users = await collection.findOne({username: 'rommel'});
        // console.log(users);
        reply.send(users);
      } catch (err) {
        this.fastifyInstance.log.error(err);

        return new Error('Something went wrong');
      }
    });
  }
}
