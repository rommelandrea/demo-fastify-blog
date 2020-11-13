import BaseSchema from '../base/base-schema';

/**
 * Post Schema
 *
 * @export
 * @class PostSchema
 * @extends {BaseSchema}
 */
export default class PostSchema extends BaseSchema {
  properties = {
    _id: {
      type: 'string',
      nullable: false,
    },
    title: {
      type: 'string',
      nullable: false,
    },
    content: {
      type: 'string',
      nullable: true,
    },
  };

  required = [ 'title' ];
}
