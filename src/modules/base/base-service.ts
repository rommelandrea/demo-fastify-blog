import { ObjectId } from 'mongodb';
import querystring from 'querystring';
import util from 'util';
import url from 'url';
import { FastifyReply } from 'fastify';
import dotenv from 'dotenv';

import _get from 'lodash/get';
import _isEqual from 'lodash/isEqual';
import _reject from 'lodash/reject';

import BaseModel from './base-model';
import IndexParams from '../../utils/index-params';

/**
 *
 *
 * @export
 * @class BaseService
 */
export default class BaseService {
  protected modelType: any;

  protected fastifyInstance: any;

  protected _collection = '';

  protected schema: any;

  /**
   *Creates an instance of BaseService.
   * @param {*} modelType
   * @param {*} fastifyInstance
   * @param {*} schema
   * @memberof BaseService
   */
  constructor(modelType: any, fastifyInstance: any, schema: any) {
    dotenv.config();
    this.modelType = modelType;
    this.fastifyInstance = fastifyInstance;
    this.schema = schema;
  }

  /**
   *
   *
   * @readonly
   * @type {string}
   * @memberof BaseService
   */
  get collectionName(): string {
    return this._collection;
  }

  /**
   *
   *
   * @readonly
   * @type {string}
   * @memberof BaseService
   */
  get pathPrefix(): string {
    return `/${this._collection}`;
  }

  /**
   *
   *
   * @protected
   * @param {*} request
   * @param {*} model
   * @param {*} schema
   * @param {*} [fixedParamsToSet=null]
   * @return {IndexParams}
   * @memberof BaseService
   */
  protected getIndexParams(request: any, model: any, schema: any, fixedParamsToSet: any = null): IndexParams {
    return new IndexParams(request, model, schema, fixedParamsToSet);
  }

  /**
   *
   *
   * @param {*} body
   * @param {(FastifyReply | null)} [reply=null]
   * @return {Promise<BaseModel>}
   * @memberof BaseService
   */
  public async create(body: any, reply: FastifyReply | null = null): Promise<BaseModel> {
    try {
      delete body._id;
      const resp = await this.fastifyInstance.mongo.db.collection(this.collectionName).insertOne(body);
      if (resp == null || resp === undefined || resp.ops.length < 1) {
        throw new Error('Insert didn\'t work');
      } else {
        return Object.assign(new this.modelType(), resp.ops[0]);
      }
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  /**
   *
   *
   * @param {string} id
   * @param {(FastifyReply | null)} [reply=null]
   * @return {(Promise<BaseModel | null>)}
   * @memberof BaseService
   */
  public async show(id: string, reply: FastifyReply | null = null): Promise<BaseModel | null> {
    try {
      const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
      if (checkForHexRegExp.test(id)) {
        const resp = await this.fastifyInstance.mongo.db
            .collection(this.collectionName)
            .findOne({ _id: new ObjectId(id) });
        return resp;
      } else {
        return null;
      }
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  /**
   *
   *
   * @param {string} id
   * @param {(FastifyReply | null)} [reply=null]
   * @return {(Promise<{ _id: string } | null>)}
   * @memberof BaseService
   */
  public async delete(id: string, reply: FastifyReply | null = null): Promise<{ _id: string } | null> {
    try {
      const resp = await this.fastifyInstance.mongo.db
          .collection(this.collectionName)
          .deleteOne({ _id: new ObjectId(id) });
      if (
        resp == null ||
        resp === undefined ||
        resp.deletedCount === undefined ||
        resp.deletedCount == null ||
        resp.deletedCount === 0
      ) {
        return null;
      }
      return { _id: id };
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  /**
   *
   *
   * @param {*} request
   * @param {(FastifyReply | null)} [reply=null]
   * @return {Promise<BaseModel[]>}
   * @memberof BaseService
   */
  public async index(request: any, reply: FastifyReply | null = null): Promise<BaseModel[]> {
    try {
      // this.getBasicQueryParams(request.query);
      const indexParams = this.getIndexParams(request, this.modelType, this.schema);

      // eslint-disable-next-line prefer-const
      let pipelineLookup: any[] = [
        { $match: indexParams.queryParams },
        { $sort: { [indexParams.sortBy]: indexParams.orderBy } },
      ];
      if (indexParams.paginate != null) {
        pipelineLookup.push({ $skip: indexParams.page * indexParams.paginate });
        pipelineLookup.push({ $limit: indexParams.paginate });
      }
      if (indexParams.lookup !== null) {
        pipelineLookup.push(...indexParams.lookup);
      }
      // console.log(pipelineLookup);
      const response = await this.fastifyInstance.mongo.db.collection(this.collectionName).aggregate(pipelineLookup);
      const output = response.toArray();
      // console.log(output);
      return output;
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  /**
   *
   *
   * @param {*} request
   * @param {*} reply
   * @memberof BaseService
   */
  public async indexAndHeaders(request: any, reply: any) {
    const queryParams = this.getIndexParams(request, this.modelType, this.schema);
    if (queryParams.paginate != null) {
      const count = await this.fastifyInstance.mongo.db
          .collection(this.collectionName)
          .countDocuments(queryParams.queryParams);
      // eslint-disable-next-line prefer-const
      let query = request.query;
      const lastPage = queryParams.paginate == null ? 1 : Math.max(Math.ceil(count / queryParams.paginate), 1);
      const previousPage = queryParams.page === 0 ? null : queryParams.page;
      const nextPage = queryParams.page < lastPage - 1 ? queryParams.page + 2 : null;
      const format = '<%s>; rel="%s"';
      delete query.page;
      // eslint-disable-next-line max-len
      const fullUrl = `${request.protocol}://${request.headers.host}${
        url.parse(request.url).pathname
      }?${querystring.stringify(query)}&`;
      const prevLink = util.format(format, previousPage == null ? '' : `${fullUrl}page=${previousPage}`, 'prev');
      const nextLink = util.format(format, nextPage == null ? '' : `${fullUrl}page=${nextPage}`, 'next');
      const firstLink = util.format(
          format,
        previousPage == null && nextPage == null ? '' : `${fullUrl}page=1`,
        'first',
      );
      const lastLink = util.format(format, lastPage == null ? '' : `${fullUrl}page=${lastPage}`, 'last');
      const links = util.format('%s,%s,%s,%s', prevLink, nextLink, firstLink, lastLink);
      reply.header('link', links);
      reply.header('total', count);
    }
  }

  /**
   *
   *
   * @param {string} id
   * @param {*} body
   * @param {(FastifyReply | null)} [reply=null]
   * @return {(Promise<BaseModel | null>)}
   * @memberof BaseService
   */
  public async update(id: string, body: any, reply: FastifyReply | null = null): Promise<BaseModel | null> {
    try {
      delete body._id;
      const resp = await this.fastifyInstance.mongo.db
          .collection(this.collectionName)
          .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: body }, { returnOriginal: false });
      if (resp != null && resp !== undefined && resp.value != null && resp.value !== undefined) {
        return resp.value;
      }
      return null;
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  /**
   *
   *
   * @param {*} query
   * @memberof BaseService
   */
  public async getBasicQueryParams(query: any) {
    query.page = query.page !== undefined && query.page !== null ? Number.parseInt(query.page) - 1 : 0;
    query.paginate = query.paginate !== undefined && query.paginate !== null ? Number.parseInt(query.paginate) : null;

    if (query.sort_by == undefined || query.sort_by == null) {
      if (query.sort_by !== 'id') {
        query.sortBy = '_id';
      }
    }
    if (query.order_by !== undefined && query.order_by != null) {
      if (!isNaN(Number(query.order_by))) {
        query.orderBy = query.order_by;
      } else {
        query.orderBy = query.order_by.toLowerCase() === 'asc' ? 1 : -1;
      }
    } else {
      query.orderBy = 1;
    }
  }

  /**
   *
   *
   * @protected
   * @param {number} errorCode
   * @param {(FastifyReply | null)} reply
   * @memberof BaseService
   */
  protected async setErrorCodeIfReply(errorCode: number, reply: FastifyReply | null) {
    if (reply !== undefined && reply != null) {
      reply.code(errorCode);
    }
  }

  /**
   *
   *
   * @param {string} id
   * @param {string} childFieldName
   * @param {*} body
   * @param {(FastifyReply | null)} [reply=null]
   * @return {*}
   * @memberof BaseService
   */
  public async createChild(id: string, childFieldName: string, body: any, reply: FastifyReply | null = null) {
    const outp: null | any = await this.show(id, reply);
    if (outp == null) {
      return outp;
    }
    // outp = Object.assign(new Cart(), outp);
    outp[childFieldName] = this.createChildAndGetUpdatedArray(outp, childFieldName, body);
    const updObj: any = {};
    updObj[childFieldName] = outp[childFieldName];
    return this.update(id, updObj, reply);
  }

  /**
   *
   *
   * @param {string} id
   * @param {string} childFieldName
   * @param {string} childId
   * @param {*} body
   * @param {(FastifyReply | null)} [reply=null]
   * @return {*}
   * @memberof BaseService
   */
  public async updateChild(
      id: string,
      childFieldName: string,
      childId: string,
      body: any,
      reply: FastifyReply | null = null,
  ) {
    const outp: null | any = await this.show(id, reply);
    if (outp == null) {
      return outp;
    }
    const childIndex = outp[childFieldName].findIndex((x: { child_id: string }) => x.child_id == childId);
    if (childIndex == -1) {
      return null;
    }
    outp[childFieldName] = this.updateChildAtIndexAndGetUpdatedArray(outp, childFieldName, childIndex, body);
    const updObj: any = {};
    updObj[childFieldName] = outp[childFieldName];
    return this.update(id, updObj, reply);
  }

  /**
   *
   *
   * @param {string} id
   * @param {string} childFieldName
   * @param {string} childId
   * @param {(FastifyReply | null)} [reply=null]
   * @return {*}
   * @memberof BaseService
   */
  public async deleteChild(id: string, childFieldName: string, childId: string, reply: FastifyReply | null = null) {
    const outp: null | any = await this.show(id, reply);
    if (outp == null) {
      return outp;
    }
    const childIndex = outp[childFieldName].findIndex((x: { child_id: string }) => x.child_id == childId);
    if (childIndex == -1) {
      return null;
    }
    outp[childFieldName] = this.deleteChildAtIndexAndGetUpdatedArray(outp, childFieldName, childIndex);
    const updObj: any = {};
    updObj[childFieldName] = outp[childFieldName];
    return this.update(id, updObj, reply);
  }

  /**
   *
   *
   * @protected
   * @param {*} item
   * @param {string} fieldName
   * @param {*} bodyToInsert
   * @return {*}
   * @memberof BaseService
   */
  protected createChildAndGetUpdatedArray(item: any, fieldName: string, bodyToInsert: any) {
    bodyToInsert = this.normalizeChildFieldBody(fieldName, bodyToInsert);
    if (item[fieldName] === undefined || item[fieldName] == null) {
      item[fieldName] = [bodyToInsert];
    } else {
      item[fieldName].push(bodyToInsert);
    }
    return item[fieldName];
  }

  /**
   *
   *
   * @protected
   * @param {*} bodyToCheck
   * @return {*}
   * @memberof BaseService
   */
  protected addChildIdIfNeeded(bodyToCheck: any) {
    if (bodyToCheck.child_id === undefined || bodyToCheck.child_id == null) {
      bodyToCheck.child_id = new ObjectId().toString();
    }
    return bodyToCheck;
  }

  /**
   *
   *
   * @protected
   * @param {*} item
   * @param {string} fieldName
   * @param {string} childIndex
   * @param {*} bodyToInsert
   * @return {*}
   * @memberof BaseService
   */
  protected updateChildAtIndexAndGetUpdatedArray(item: any, fieldName: string, childIndex: string, bodyToInsert: any) {
    bodyToInsert = this.normalizeChildFieldBody(fieldName, { ...item[fieldName][childIndex], ...bodyToInsert });
    item[fieldName][childIndex] = bodyToInsert;
    return item[fieldName];
  }

  /**
   *
   *
   * @protected
   * @param {*} item
   * @param {string} fieldName
   * @param {string} childIndex
   * @return {*}
   * @memberof BaseService
   */
  protected deleteChildAtIndexAndGetUpdatedArray(item: any, fieldName: string, childIndex: string) {
    item[fieldName].splice(childIndex, 1);
    return item[fieldName];
  }

  /**
   *
   *
   * @protected
   * @param {string} fieldNameToCheckFor
   * @param {*} bodyToNormalize
   * @return {*}
   * @memberof BaseService
   */
  protected normalizeChildFieldBody(fieldNameToCheckFor: string, bodyToNormalize: any) {
    const schema: any = this.schema.properties;
    // eslint-disable-next-line prefer-const
    let outpObj: any = {};
    Object.keys(schema[fieldNameToCheckFor].items.properties).forEach((element) => {
      if (bodyToNormalize[element] !== undefined) {
        outpObj[element] = bodyToNormalize[element];
      }
    });
    outpObj = this.addChildIdIfNeeded(outpObj);
    return outpObj;
  }
}
