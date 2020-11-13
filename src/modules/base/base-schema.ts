/* eslint-disable require-jsdoc */

export default class BaseSchema {
  public properties = {};

  public mediaContentProperties = {
    child_id: {
      type: 'string',
      nullable: false,
    },
    filename: { type: 'string' },
    path: { type: 'string' },
    is_video: { type: 'boolean', default: false },
    type: { type: 'string' },
    published: { type: 'boolean', default: true },
    mimetype: { type: 'string' },
    order: { type: 'string', default: 0 },
  };

  public required: string[] = [];

  get getOneSchema(): any {
    return {
      tags: [ this.constructor.name ],
      response: {
        200: {
          type: 'object',
          properties: this.properties,
        },
      },
    };
  }

  get getAllSchema(): any {
    return {
      tags: [ this.constructor.name ],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: this.properties,
          },
        },
      },
    };
  }

  get createSchema(): any {
    return {
      tags: [ this.constructor.name ],
      body: {
        type: 'object',
        required: this.required,
        properties:
          this.properties,
      },
      response: {
        201: {
          type: 'object',
          properties: this.properties,
        },
      },
    };
  }

  get updateSchema(): any {
    return {
      tags: [ this.constructor.name ],
      body: {
        type: 'object',
        required: this.required,
        properties:
          this.properties,
      },
      response: {
        200: {
          type: 'object',
          properties: this.properties,
        },
      },
    };
  }

  get deleteSchema(): any {
    return {
      tags: [ this.constructor.name ],
      response: {
        200: {
          type: 'object',
          properties: { _id: { type: 'string' } },
        },
      },
    };
  }

  get createMediaContentSchema(): any {
    return {
      tags: [ this.constructor.name ],
      consumes: [ 'multipart/form-data' ],
      body: {
        type: 'object',
        required: [ 'file' ],
        properties: {
          file: { $ref: '#tests' },
        },
      },
      response: {
        200: {
          description: 'Succesful response',
          type: 'object',
          properties: {
            a: { type: 'integer', nullable: true },
          },
        },
      },
    };
  }

  get putMediaContentSchema(): any {
    return {
      tags: [ this.constructor.name ],
      body: {
        type: 'object',
        required: [],
        properties:
          this.mediaContentProperties,
      },
      response: {
        200: {
          type: 'object',
          properties: this.mediaContentProperties,
        },
      },
    };
  }
}
