import { createCustomMethodDecorator } from '@midwayjs/core';

/** 数据库事务隔离级别类型 */
type IsolationLevel = 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

/** 事务配置选项接口 */
export interface TransactionOptions {
  /** 事务名称 */
  name?: string;
  /** 事务隔离级别 */
  isolation?: IsolationLevel;
}

/** 事务装饰器元数据键 */
export const TRANSACTION_KEY = 'falcon:decorator:transaction';

/**
 * 数据库事务装饰器。
 *
 * @param option - 事务配置选项。
 * @returns 方法装饰器。
 */
export function Transaction(option?: TransactionOptions): MethodDecorator {
  return createCustomMethodDecorator(TRANSACTION_KEY, option);
}
