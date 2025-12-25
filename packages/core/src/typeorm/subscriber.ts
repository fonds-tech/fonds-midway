import { snowflake } from '../util/snowflake';
import { ParamInvalidError } from '../error/param';
import { EventSubscriberModel } from '@midwayjs/typeorm';
import { BeforeQueryEvent, EntitySubscriberInterface, InsertEvent } from 'typeorm';

@EventSubscriberModel()
export class PrimaryColumnSubscriber implements EntitySubscriberInterface {
  beforeQuery(event: BeforeQueryEvent<any>): Promise<any> | void {
    // 检查查询条件中是否包含 id 参数
    if (event.query && event.query.length > 0) {
      const queryString = event.query.toLowerCase();

      // 检查是否是包含 WHERE 子句的查询
      if (queryString.includes('where') && queryString.includes('id')) {
        // 获取查询参数
        const parameters = event.parameters || [];

        // 验证参数中的 id 值
        parameters.forEach((param, index) => {
          if (typeof param === 'string' || typeof param === 'number') {
            const paramStr = param.toString();
            // 检查是否为数字字符串
            if (!/^\d+$/.test(paramStr)) {
              throw new ParamInvalidError(`id 参数无效`);
            }
          } else if (Array.isArray(param)) {
            // 处理数组参数的情况
            param.forEach((item, itemIndex) => {
              const itemStr = item.toString();
              if (!/^\d+$/.test(itemStr)) {
                throw new ParamInvalidError(`索引 ${itemIndex} 处的 id 参数无效`);
              }
            });
          }
        });
      }
    }
  }
  beforeInsert(event: InsertEvent<any>) {
    if (!event.entity.id) {
      event.entity.id = snowflake.nextId().toString();
    }
  }
}
