import { BaseVO } from './base';
import { Type, Expose } from 'class-transformer';

/**
 * 分页数据VO。
 */
export class PageVO {
  @Expose()
  @Type(() => BaseVO)
  list: BaseVO[];
}
