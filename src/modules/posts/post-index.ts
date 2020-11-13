import { FastifyReply } from 'fastify';
import BaseIndex from '../base/base-index';

/**
 *
 *
 * @export
 * @class PostIndex
 * @extends {BaseIndex}
 */
export default class PostIndex extends BaseIndex {
  /**
   * this function return all posts
   *
   * @param {*} request
   * @param {FastifyReply} reply
   * @return {*}
   * @memberof PostIndex
   */
  public async index(request: any, reply: FastifyReply) {
    const resp = await this.service.index(request, reply);
    await this.service.indexAndHeaders(request, reply);
    return reply.send(resp);
  }

  /**
   * this function return the item with the id passed on path
   *
   * @param {*} request
   * @param {FastifyReply} reply
   * @return {*} object
   * @memberof PostIndex
   */
  public async show(request: any, reply: FastifyReply) {
    const resp = await this.service.show(request.params.id, reply);
    if (resp === undefined || resp == null) {
      return reply.code(404).send(new Error('Item not found'));
    }

    return reply.send(resp);
  }

  /**
   * create new item
   *
   * @param {*} request
   * @param {FastifyReply} reply
   * @return {*} return the item created
   * @memberof PostIndex
   */
  public async create(request: any, reply: FastifyReply) {
    const resp = await this.service.create(request.body, reply);

    return reply.code(201).send(resp);
  }

  /**
   * this function update an item
   *
   * @param {*} request
   * @param {FastifyReply} reply
   * @return {*} return the updated item
   * @memberof PostIndex
   */
  public async update(request: any, reply: FastifyReply) {
    const resp = await this.service.update(request.params.id, request.body, reply);
    if (resp === undefined || resp == null) {
      return reply.code(404).send(new Error('Item not found'));
    }

    return reply.send(resp);
  }

  /**
   * this function delete the item passed
   *
   * @param {*} request
   * @param {FastifyReply} reply
   * @return {*} the id of item deleted
   * @memberof PostIndex
   */
  public async delete(request: any, reply: FastifyReply) {
    const resp = await this.service.delete(request.params.id, reply);
    if (resp === undefined || resp == null) {
      return reply.code(404).send(new Error('Item not found'));
    }

    return reply.send(resp);
  }
}
