/* eslint-disable require-jsdoc */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import BaseModel from './base-model';
import BaseService from './base-service';
// import BaseSchema from './base-schema';

export default class BaseIndex {
  protected prefix: string;

  protected fastifyInstance: any;

  protected service: any;

  protected schema: any;

  protected authenticatedRoutes: string[] = [ '*' ];

  constructor(
      fastifyInstance: FastifyInstance,
      serviceToUse: BaseService,
      schema: any,
      routesPrefix: string | null = null,
      authenticatedRoutes: string[] = [ '*' ],
  ) {
    this.fastifyInstance = fastifyInstance;
    this.service = serviceToUse;
    this.schema = schema;
    this.prefix = routesPrefix == null ? this.service.pathPrefix : routesPrefix;
    this.prefix = this.prefix?.startsWith('/') ? this.prefix : `/${this.prefix}`;
    this.authenticatedRoutes = authenticatedRoutes;
  }

  public register(): void {
    this.registerCrudRoutes();
    this.registerChildrenCrudRoutes();
  }

  protected registerCrudRoutes() {
    this.fastifyInstance.post(
        this.prefix,
        this.getRouteConfigurationObject(this.schema.createSchema, 'post'),
        async (request: FastifyRequest, reply: FastifyReply) => this.create(request, reply),
    );
    this.fastifyInstance.put(
        `${this.prefix}/:id`,
        this.getRouteConfigurationObject(this.schema.updateSchema, 'put'),
        async (request: FastifyRequest, reply: FastifyReply) => this.update(request, reply),
    );
    this.fastifyInstance.get(
        this.prefix,
        this.getRouteConfigurationObject(this.schema.getAllSchema, 'get_all'),
        async (request: FastifyRequest, reply: FastifyReply) => this.index(request, reply),
    );
    this.fastifyInstance.get(
        `${this.prefix}/:id`,
        this.getRouteConfigurationObject(this.schema.getOneSchema, 'get'),
        async (request: FastifyRequest, reply: FastifyReply) => this.show(request, reply),
    );
    this.fastifyInstance.delete(
        `${this.prefix}/:id`,
        this.getRouteConfigurationObject(this.schema.deleteSchema, 'delete'),
        async (request: FastifyRequest, reply: FastifyReply) => this.delete(request, reply),
    );
  }

  protected registerChildrenCrudRoutes(permission: string = 'put') {
    this.fastifyInstance.post(
        `${this.prefix}/:id/:childFieldName`,
        this.getRouteConfigurationObject({}, permission),
        async (request: FastifyRequest, reply: FastifyReply) => this.createChild(request, reply),
    );
    this.fastifyInstance.put(
        `${this.prefix}/:id/:childFieldName/:childId`,
        this.getRouteConfigurationObject({}, permission),
        async (request: FastifyRequest, reply: FastifyReply) => this.updateChild(request, reply),
    );
    this.fastifyInstance.delete(
        `${this.prefix}/:id/:childFieldName/:childId`,
        this.getRouteConfigurationObject({}, permission),
        async (request: FastifyRequest, reply: FastifyReply) => this.deleteChild(request, reply),
    );
  }

  protected getRouteConfigurationObject(schemaToUse: any, routeName: string | null = null) {
    const outputObj: { schema: any, preValidation: any, preHandler: any } = {
      schema: schemaToUse,
      preValidation: null,
      preHandler: null,
    };
    // if (
    //   routeName != null && routeName !== undefined &&
    //   [ 'post', 'get_all', 'get', 'put', 'delete' ].includes(routeName)
    // ) {
    //   const permissionsMap: { [key: string]: any } = {
    //     post: 'create', get_all: 'view', get: 'view', put: 'edit', delete: 'delete',
    //   };
    //   const permissionToCheckFor = (`${this.service.collectionName}_${permissionsMap[routeName]}`);
    //   outputObj.preHandler = [
    //     this.fastifyInstance.auth([ this.fastifyInstance.tokenChecker ]),
    //     (
    //         req: FastifyRequest,
    //         reply: FastifyReply,
    //         done: any,
    //     ) => {
    //       this.fastifyInstance.permissionsChecker(req, reply, done, permissionToCheckFor);
    //     } ];
    // } else if (this.authenticatedRoutes.includes('*')) {
    //   outputObj.preHandler = [
    //     this.fastifyInstance.auth([ this.fastifyInstance.tokenChecker ]),
    //   ];
    // }
    return outputObj;
  }

  public async create(request: any, reply: FastifyReply) {
    const resp = await this.service.create(request.body, reply);
    // console.log(resp);
    return reply.code(201).send(resp);
  }

  public async index(request: any, reply: FastifyReply) {
    const resp = await this.service.index(request, reply);
    await this.service.indexAndHeaders(request, reply);
    // console.log(resp);
    return reply.send(resp);
  }

  public async show(request: any, reply: FastifyReply) {
    const resp = await this.service.show(request.params.id, reply);
    if (resp === undefined || resp == null) {
      return reply.code(404).send(new Error('Item not found'));
    }

    return reply.send(resp);
  }

  public async update(request: any, reply: FastifyReply) {
    const resp = await this.service.update(request.params.id, request.body, reply);
    if (resp === undefined || resp == null) {
      return reply.code(404).send(new Error('Item not found'));
    }

    return reply.send(resp);
  }

  public async delete(request: any, reply: FastifyReply): Promise<{ _id: string }> {
    const resp = await this.service.delete(request.params.id, reply);
    if (resp === undefined || resp == null) {
      return reply.code(404).send(new Error('Item not found'));
    }

    return reply.send(resp);
  }

  public async createMediaContent(request: any, reply: FastifyReply) {
    const resp = await this.service.createMediaContent(request.params.id, request, reply);
    if (resp === undefined || resp == null) {
      return reply.code(404).send(new Error('Item not found'));
    }

    return reply.send(resp);
  }

  public async postUpdateMediaContent(request: any, reply: FastifyReply) {
    const resp = await this.service.postUpdateMediaContent(
        request.params.id,
        request.params.media_content_id,
        request,
        reply,
    );
    if (resp === undefined || resp == null) {
      return reply.code(404).send(new Error('Item not found'));
    }
    return reply.send(resp);
  }

  public async putUpdateMediaContent(request: any, reply: FastifyReply) {
    const resp = await this.service.putUpdateMediaContent(
        request.params.id,
        request.params.media_content_id,
        request.body,
        reply,
    );
    if (resp === undefined || resp == null) {
      return reply.code(404).send(new Error('Item not found'));
    }
    return reply.send(resp);
  }

  public async deleteMediaContent(request: any, reply: FastifyReply) {
    const resp = await this.service.deleteMediaContent(
        request.params.id,
        request.params.media_content_id,
        reply,
    );
    if (resp === undefined || resp == null) {
      return reply.code(404).send(new Error('Item not found'));
    }
    return reply.send(resp);
  }

  public async createChild(request: any, reply: FastifyReply): Promise<BaseModel | null> {
    const resp = await this.service.createChild(
        request.params.id,
        request.params.childFieldName,
        request.body,
        reply,
    );
    if (resp == null) {
      return reply.code(404).send(resp);
    }
    return reply.code(200).send(resp);
  }

  public async updateChild(request: any, reply: FastifyReply): Promise<BaseModel | null> {
    const resp = await this.service.updateChild(
        request.params.id,
        request.params.childFieldName,
        request.params.childId,
        request.body,
        reply,
    );
    if (resp == null) {
      return reply.code(404).send(resp);
    }
    return reply.code(200).send(resp);
  }

  public async deleteChild(request: any, reply: FastifyReply): Promise<BaseModel | null> {
    const resp = await this.service.deleteChild(
        request.params.id,
        request.params.childFieldName,
        request.params.childId,
        reply,
    );
    if (resp == null) {
      return reply.code(404).send(resp);
    }
    return reply.code(200).send(resp);
  }
}
