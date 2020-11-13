import { FastifyInstance } from 'fastify';
import BaseIndex from '../modules/base/base-index';
import BaseModel from '../modules/base/base-model';
import BaseSchema from '../modules/base/base-schema';
import BaseService from '../modules/base/base-service';
import PostIndex from '../modules/posts/post-index';
import Post from '../modules/posts/post-model';
import PostSchema from '../modules/posts/post-schema';
import PostService from '../modules/posts/post-service';

interface RouteElement {
  Schema: typeof BaseSchema;
  Index: typeof BaseIndex;
  routesPath: string;
  Model: typeof BaseModel;
  Service: typeof BaseService;
  prefix?: string | null;
}

/**
 *
 *
 * @export
 * @class RouteUtils
 */
export default class RouteUtils {
  static defaultPrefix = '/api/v1';

  static routesConfigurations: RouteElement[] = [
    {
      Schema: PostSchema,
      Index: PostIndex,
      routesPath: '/posts',
      Model: Post,
      Service: PostService,
    },
  ];

  /**
   *
   *
   * @static
   * @param {FastifyInstance} fastifyInstance
   * @memberof RouteUtils
   */
  static registerRoutes(fastifyInstance: FastifyInstance): void {
    RouteUtils.routesConfigurations.forEach((element) => {
      let routesPath = element.prefix === undefined || element.prefix == null ? this.defaultPrefix : element.prefix;
      routesPath = routesPath.concat(element.routesPath).replace('//', '/');
      const schemaInstanceToUse = new element.Schema();
      const toBeRegistered = new element.Index(
          fastifyInstance,
          new element.Service(element.Model, fastifyInstance, schemaInstanceToUse),
          new element.Schema(),
          routesPath,
      );
      toBeRegistered.register();
      // this.registerSharedSchema(fastifyInstance, schemaInstanceToUse);
    });
  }

  /**
   *
   *
   * @static
   * @param {FastifyInstance} fastifyInstance
   * @param {BaseSchema} schemaInstance
   * @memberof RouteUtils
   */
  static registerSharedSchema(fastifyInstance: FastifyInstance, schemaInstance: BaseSchema): void {
    fastifyInstance.addSchema({
      $id: schemaInstance.constructor.name,
      type: 'object',
      properties: schemaInstance.properties,
    });
  }
}
