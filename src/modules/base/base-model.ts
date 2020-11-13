/**
 * Base Model
 *
 * @export
 * @class BaseModel
 */
export default class BaseModel {
  public _id!: string;

  /**
   * return the id of object
   *
   * @readonly
   * @type {string}
   * @memberof BaseModel
   */
  get id(): string {
    return this._id;
  }
}
