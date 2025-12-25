import { Expose, Exclude } from 'class-transformer';

/**
 * 基础数据VO。
 */
export class BaseVO {
  @Expose()
  id: string;

  /**
   * 创建时间，记录数据的创建时间。
   */
  @Expose()
  createTime: string;

  /**
   * 更新时间，记录数据的最后更新时间。
   */
  @Expose()
  updateTime: string;

  /**
   * 删除时间，记录数据的删除时间。
   */
  @Exclude()
  deletedTime: string;
}
