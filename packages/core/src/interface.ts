import type { Context, Application } from '@midwayjs/koa';
import type { CommonGuardUnion, MiddlewareParamArray } from '@midwayjs/core';
import type { Brackets, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * 扩展 Midway 配置接口
 */
declare module '@midwayjs/core/dist/interface' {
  interface MidwayConfig {
    /** 核心配置 */
    core?: Partial<CoreConfig>;
  }
}

/** 核心配置接口 */
export interface CoreConfig {}

/** 模块配置接口 */
export interface ModuleConfig {
  /** 模块名称 */
  name: string;
  /** 模块描述 */
  description: string;
  /** 模块加载顺序 */
  order?: number;
  /** 模块路由守卫 */
  guard?: CommonGuardUnion;
  /** 模块中间件 */
  middlewares?: MiddlewareParamArray;
  /** 全局中间件 */
  globalMiddlewares?: MiddlewareParamArray;
}

/** 控制器选项接口 */
export interface ControllerOptions {
  /** API操作类型列表 */
  api?: ('create' | 'delete' | 'update' | 'page' | 'list' | 'detail')[];
  /** 路由别名 */
  alias?: string[];
  /** 路由守卫 */
  guard?: CommonGuardUnion;
  /** 路由前缀 */
  prefix?: string;
  /** 所属模块 */
  module?: string;
  /** 关联实体 */
  entity?: any;
  /** 关联服务 */
  service?: any;
  /** 标签名称 */
  tagName?: string;
  /** 是否大小写敏感 */
  sensitive?: boolean;
  /** 权限列表 */
  authority?: string[];
  /** 中间件 */
  middleware?: MiddlewareParamArray;
  /** 描述信息 */
  description?: string;
  /** 分页查询选项 */
  pageQueryOptions?: QueryOptions | ((ctx: Context, app: Application) => Promise<QueryOptions>);
  /** 列表查询选项 */
  listQueryOptions?: QueryOptions | ((ctx: Context, app: Application) => Promise<QueryOptions>);
  /** 是否忽略全局前缀 */
  ignoreGlobalPrefix?: boolean;
  /** 创建前钩子 */
  beforeCreate?: (ctx: Context, app: Application) => Record<string, any>;
  /** 更新前钩子 */
  beforeUpdate?: (ctx: Context, app: Application) => Record<string, any>;
  /** 其他自定义选项 */
  [key: string]: any;
}

/** 路由选项接口 */
export interface RouterOptions {
  /** 是否大小写敏感 */
  sensitive?: boolean;
  /** 中间件 */
  middleware?: MiddlewareParamArray;
  /** 描述信息 */
  description?: string;
  /** 标签名称 */
  tagName?: string;
  /** 是否忽略全局前缀 */
  ignoreGlobalPrefix?: boolean;
}

/** Where条件类型 */
export type Where = Brackets | string | ((qb: any) => string) | ObjectLiteral | ObjectLiteral[];

/** 相等条件接口 */
export interface EqualCondition {
  /** 列名 */
  column: string;
  /** 参数名 */
  param: string;
}

/** 关联查询接口 */
export interface Join {
  // 实体
  entity: any;
  // 别名
  alias: string;
  // 关联条件
  condition: string;
  // 关联类型
  type?: 'innerJoin' | 'leftJoin';
}

/** 查询选项接口 */
export interface QueryOptions {
  /** Where条件生成函数或条件数组 */
  where?: (ctx: Context, app: Application) => Promise<[Where, ObjectLiteral][]> | [Where, ObjectLiteral][];
  /** 关联查询配置 */
  joins?: Join[];
  /** 排序配置 */
  orderBy?: { [field: string]: 'asc' | 'desc' };
  /** 查询字段列表 */
  select?: string[];
  /** 模糊匹配字段 */
  likeFields?: string[] | EqualCondition[] | (string | EqualCondition)[];
  /** 精确匹配字段 */
  equalFields?: string[] | EqualCondition[] | (string | EqualCondition)[];
  /** 关键词搜索字段 */
  keyWordFields?: string[];
  /** 查询前钩子 */
  beforeQuery?: (query: SelectQueryBuilder<any>, ctx: Context, app: Application) => Promise<void>;
}

/** 标签选项类型 */
export type tagOptions = string | string[];
