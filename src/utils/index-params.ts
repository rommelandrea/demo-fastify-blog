import { FastifyRequest } from 'fastify';
import { ObjectId } from 'mongodb';
import { isNumber } from 'util';
import pluralize from 'pluralize';

/**
 *
 *
 * @class IndexParams
 */
class IndexParams {
  private readonly request: any;

  public readonly paginate: number | null = null;

  public readonly page: number = 0;

  public readonly sortBy: string = '_id';

  public readonly orderBy: number = 1;

  public readonly lookup: any = null;

  private model: any;

  private schema: any;

  private _queryParams: any;

  public readonly fixedParamsToSet: any = null;

  /**
   * Creates an instance of IndexParams.
   *
   * @param {FastifyRequest} request
   * @param {*} model
   * @param {*} schema
   * @param {*} [fixedParamsToSet=null]
   * @memberof IndexParams
   */
  constructor(request: FastifyRequest, model: any, schema: any, fixedParamsToSet: any = null) {
    this.request = request;
    this.model = model;
    this.schema = schema;
    this.fixedParamsToSet = fixedParamsToSet;
    this.page = this.request.query.page !== undefined && this.request.query.page !== null
      ? Number.parseInt(this.request.query.page) - 1
      : this.page;
    this.paginate = this.request.query.paginate !== undefined && this.request.query.paginate !== null
      ? Number.parseInt(this.request.query.paginate)
      : this.paginate;
    this.sortBy = '_id';
    if (this.request.query.sort_by !== undefined && this.request.query.sort_by !== null) {
      if (this.request.query.sort_by !== 'id') {
        this.sortBy = this.request.query.sort_by;
      }
    }
    // this.sortBy = this.request.query.sort_by || '_id';
    if (this.request.query.order_by !== undefined && this.request.query.order_by != null) {
      if (typeof this.request.query.order_by === 'number') {
        this.orderBy = this.request.query.order_by;
      } else {
        this.orderBy = this.request.query.order_by.toLowerCase() === 'asc' ? 1 : -1;
      }
    }
    this.lookup = this.getLookup();
    this._queryParams = this.getQueryObject();
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberof IndexParams
   */
  get queryParams(): any {
    return this._queryParams;
  }

  /**
   *
   *
   * @private
   * @returns {*}
   * @memberof IndexParams
   */
  private getLookup(): any {
    if (this.request.query.lookup !== undefined && this.request.query.lookup != null) {
      const lookupFieldNames = this.request.query.lookup.split(',');

      let output: any[] = [];
      lookupFieldNames.forEach((fieldName: string) => {
        // -3 because '_id'
        const nameWoId = fieldName.substr(0, (fieldName.length - 3));
        const collectionName = pluralize.plural(nameWoId);

        output.push({
          $lookup: {
            from: collectionName,
            // eslint-disable-next-line quote-props
            let: {
              'tempVar': {
                $convert:
                  {
                    input: `$${fieldName}`,
                    to: 'objectId',
                    onError: null, // Optional.
                    onNull: null, // Optional.
                  },
              },
            },
            // let: { 'tempVar': { $toObjectId: (`$${fieldName}`) } },
            pipeline: [
              { '$match': { '$expr': { '$eq': ['$_id', '$$tempVar'] } } },
            ],
            as: nameWoId,
          },
        },
        {
          $unwind: { 'path': `$${nameWoId}`, preserveNullAndEmptyArrays: true },
        },
        );
      });
      // console.log(output);
      return (output.length === 0 ? null : output);
    }
    return null;
  }

  /**
   *
   *
   * @private
   * @return {*}
   * @memberof IndexParams
   */
  private getQueryObject() {
    let output: any = {};
    const validParams = this.getQueryParamsFromRequest();
    const paramsKeys = Object.keys(validParams);
    if (paramsKeys.length > 0) {
      output = this.getClausesForFields(validParams, paramsKeys);
    }
    return output;
  }

  /**
   *
   *
   * @private
   * @param {{ [key: string]: string }} validParams
   * @param {string[]} paramsKeys
   * @return {*}
   * @memberof IndexParams
   */
  private getClausesForFields(validParams: { [key: string]: string }, paramsKeys: string[]) {
    const output: any = { $and: [] };
    const schemaAttributesKeys = Object.keys(this.schema.properties);
    schemaAttributesKeys.push('_id');

    paramsKeys.forEach((par) => {
      const temp = this.getClauseForSingleField(par, schemaAttributesKeys, validParams);
      if (temp != null) {
        if (temp._id !== undefined && temp._id != null) {
          temp._id = new ObjectId(temp._id);
        }
        output.$and?.push(temp);
      }
    });
    if (output.$and != null && output.$and !== undefined && output.$and.length < 1) {
      delete output.$and;
    }
    return output;
  }

  /**
   *
   *
   * @private
   * @param {string} parameterKey
   * @param {string[]} schemaAttributesKeys
   * @param {{ [key: string]: string }} validParams
   * @return {*}
   * @memberof IndexParams
   */
  private getClauseForSingleField(
      parameterKey: string,
      schemaAttributesKeys: string[],
      validParams: { [key: string]: string },
  ) {
    let keyToSearchFor = parameterKey;
    const splitted = parameterKey.split('^');

    let isOrClause = false;

    if (splitted.length > 1) {
      isOrClause = splitted[0] === 'or';
      keyToSearchFor = splitted[1];
    }

    if (schemaAttributesKeys.includes(keyToSearchFor)) {
      const paramValue = validParams[parameterKey];
      return this.prepareSingleClauseObject(paramValue, keyToSearchFor);
    }
    return null;
  }

  /**
   *
   *
   * @private
   * @param {string} valueToCheck
   * @param {string} keyInObject
   * @return {*}
   * @memberof IndexParams
   */
  private prepareSingleClauseObject(valueToCheck: string, keyInObject: string) {
    let startsWith: string | null = null;
    let index = 0;
    const startsToCheck = ['??', 'in_', 'nin_', 'lt_', 'gt_', 'lte_', 'gte_', '!!'];
    while (startsWith == null && index < startsToCheck.length) {
      if (valueToCheck.startsWith(startsToCheck[index])) {
        startsWith = startsToCheck[index];
      }
      index += 1;
    }
    let output: { [key: string]: any } | null = null;
    if (startsWith != null) {
      let valueToOutput: any = valueToCheck.substr(startsWith.length);
      valueToOutput = valueToOutput === 'null' ? null : valueToOutput;
      const splittedValue = valueToOutput != null ? valueToOutput.split('^') : null;

      switch (startsWith) {
        case '??':
          if (valueToOutput != null) {
            output = { [keyInObject]: { $regex: new RegExp(`.*${valueToOutput}.*`, 'i') } };
          }
          break;
        case '!!':
          output = { [keyInObject]: { $ne: valueToOutput } };
          break;
        case 'in_':
          if (valueToOutput != null) {
            output = { [keyInObject]: { $in: splittedValue } };
          }
          break;
        case 'nin_':
          if (valueToOutput != null) {
            output = { [keyInObject]: { $nin: splittedValue } };
          }
          break;
        case 'lt_':
          if (valueToOutput != null && splittedValue != null) {
            if (splittedValue.length > 1) {
              if (splittedValue[1].startsWith('gt_')) {
                const gt = splittedValue[1].substring(3);
                output = { [keyInObject]: { $lt: splittedValue[0], $gt: gt } };
              } else {
                const gt = splittedValue[1].substring(4);
                output = { [keyInObject]: { $lt: splittedValue[0], $gte: gt } };
              }
            } else {
              output = { [keyInObject]: { $lt: splittedValue[0] } };
            }
          }
          break;
        case 'lte_':
          if (valueToOutput != null) {
            if (splittedValue.length > 1) {
              if (splittedValue[1].startsWith('gt_')) {
                const gt = splittedValue[1].substring(3);
                output = { [keyInObject]: { $lte: splittedValue[0], $gt: gt } };
              } else {
                const gt = splittedValue[1].substring(4);
                output = { [keyInObject]: { $lte: splittedValue[0], $gte: gt } };
              }
            } else {
              output = { [keyInObject]: { $lte: splittedValue[0] } };
            }
          }
          break;
        case 'gt_':
          if (valueToOutput != null) {
            if (splittedValue.length > 1) {
              if (splittedValue[1].startsWith('lt_')) {
                const gt = splittedValue[1].substring(3);
                output = { [keyInObject]: { $gt: splittedValue[0], $lt: gt } };
              } else {
                const gt = splittedValue[1].substring(4);
                output = { [keyInObject]: { $gt: splittedValue[0], $lte: gt } };
              }
            } else {
              output = { [keyInObject]: { $gt: splittedValue[0] } };
            }
          }
          break;
        case 'gte_':
          if (valueToOutput != null) {
            if (splittedValue.length > 1) {
              if (splittedValue[1].startsWith('lt_')) {
                const gt = splittedValue[1].substring(3);
                output = { [keyInObject]: { $gte: splittedValue[0], $lt: gt } };
              } else {
                const gt = splittedValue[1].substring(4);
                output = { [keyInObject]: { $gte: splittedValue[0], $lte: gt } };
              }
            } else {
              output = { [keyInObject]: { $gte: splittedValue[0] } };
            }
          }
          break;
      }
    } else {
      const valueToOutput = valueToCheck === 'null' ? null : valueToCheck;
      output = { [keyInObject]: valueToOutput };
    }
    return output;
  }

  /**
   *
   *
   * @private
   * @return {*}
   * @memberof IndexParams
   */
  private getQueryParamsFromRequest() {
    const notValidParams = ['page', 'paginate', 'sort_by', 'order_by'];

    let validParams: { [key: string]: string } = {};
    for (const key in this.request.query) {
      const isFixed = this.fixedParamsToSet != null
        && (this.fixedParamsToSet.hasOwnProperty(key)
          || this.fixedParamsToSet.hasOwnProperty(`and^${key}`)
          || this.fixedParamsToSet.hasOwnProperty(`or^${key}`));
      if (!notValidParams.includes(key) && !isFixed) {
        const test = { [key]: this.request.query[key] };
        Object.assign(validParams, test);
      }
    }
    if (this.fixedParamsToSet != null) {
      for (const key in this.fixedParamsToSet) {
        Object.assign(validParams, { [key]: this.fixedParamsToSet[key] });
      }
    }
    return validParams;
  }
}

export default IndexParams;
