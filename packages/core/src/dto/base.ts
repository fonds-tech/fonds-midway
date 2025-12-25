import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 创建数据DTO。
 */
export class CreateDTO {
  [key: string]: any;
}

/**
 * 分页查询数据DTO。
 */
export class PageDTO {
  /**
   * 页码，从1开始。
   */
  @Rule(RuleType.number())
  page: number;

  /**
   * 每页数据条数。
   */
  @Rule(RuleType.number())
  size: number;

  [key: string]: any;
}

/**
 * 列表查询数据DTO。
 */
export class ListDTO {
  [key: string]: any;
}

/**
 * 删除操作数据DTO。
 */
export class DeleteDTO {
  /**
   * 要删除的记录ID或ID数组。
   */
  @Rule(RuleType.alternatives([RuleType.string(), RuleType.array().items(RuleType.string())]).required())
  id: string | string[];

  [key: string]: any;
}

/**
 * 更新操作数据DTO。
 */
export class UpdateDTO {
  /**
   * 记录的唯一标识符。
   */
  @Rule(RuleType.string().required())
  id: string;

  [key: string]: any;
}

/**
 * 详情查询数据DTO。
 */
export class DetailDTO {
  /**
   * 记录的唯一标识符。
   */
  @Rule(RuleType.string().required())
  id: string;

  [key: string]: any;
}
