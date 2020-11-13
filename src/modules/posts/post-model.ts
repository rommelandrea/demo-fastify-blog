import BaseModel from '../base/base-model';

/**
 * Post Model
 *
 * @export
 * @class Post
 * @extends {BaseModel}
 */
export default class Post extends BaseModel {
  public title!: string;

  public content?: string;
}
