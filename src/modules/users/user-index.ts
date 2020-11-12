import { FastifyReply } from "fastify";

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
   *
   * @param fastify
   */
  constructor(fastify: any) {
    this.fastifyInstance = fastify;
  }

  /**
   *
   */
  public register() {
    const db = this.fastifyInstance.mongo.db;
    const collection = db.collection('users');

    this.fastifyInstance.get('/user', (request: any, response: FastifyReply) => {
      try {
        console.log(collection);
        const users = collection.find({});
        // console.log(users);
        response.send({});
      } catch (err) {
        this.fastifyInstance.log.error(err);

        return new Error('Something went wrong');
      }
    });
  }
}
