import type { Repository } from 'typeorm';
import type { QueryOptions } from '../interface';
import type { Context, Application } from '@midwayjs/koa';
import _ from 'lodash';
import { Brackets } from 'typeorm';
import { FailError } from '../error/fail';
import { CoreError } from '../error/core';
import { ResponseMessage } from '../enum/response';
import { getTableAliasByField } from '../util/misc';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { ParamError, ParamMissingError } from '../error/param';
import { validateOrderBy, validateKeyWord } from '../util/validate';
import { ListDTO, PageDTO, CreateDTO, UpdateDTO } from '../dto/base';
import { Init, Provide, Inject, App, Scope, ScopeEnum } from '@midwayjs/core';
import { isDef, isArray, isEmpty, isNoEmpty, isObject, isFunction } from '../util/is';
import { getCountSql, countSqlParameters, replaceOrderByPrefix, addQuotesToIdentifiers } from '../util/postgres';

/**
 * Postgres 数据库服务类，提供基础的数据库操作方法。
 */
@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export abstract class PostgresService {
  @App()
  app: Application;

  @Inject()
  ctx: Context;

  entity: Repository<unknown>;
  typeORM: TypeORMDataSourceManager;

  sqlParams: any[];

  /**
   * 初始化服务。
   */
  @Init()
  async init() {
    if (this.app.getApplicationContext().hasNamespace('typeorm')) {
      this.typeORM = await this.app.getApplicationContext().getAsync(TypeORMDataSourceManager);
    }

    this.sqlParams = [];
  }

  /**
   * 设置请求上下文。
   *
   * @param ctx - 请求上下文对象。
   */
  setCtx(ctx: Context) {
    this.ctx = ctx;
  }

  /**
   * 设置应用实例。
   *
   * @param app - 应用实例对象。
   */
  setApp(app: Application) {
    this.app = app;
  }

  /**
   * 设置数据库实体仓库。
   *
   * @param entity - 数据库实体仓库对象。
   */
  setEntity(entity: Repository<any>) {
    this.entity = entity;
  }

  /**
   * 添加数据。
   *
   * @param data - 要添加的数据对象。
   */
  async create(data: CreateDTO) {
    this.checkEntity();

    const date = new Date();
    data.createTime = date;
    data.updateTime = date;

    return await this.entity.save(data);
  }

  /**
   * 查询数据列表。
   *
   * @param query - 查询参数对象。
   * @param options - 查询选项或返回查询选项的函数。
   * @returns 查询结果数组。
   */
  async list(query: ListDTO = {}, options?: QueryOptions | ((ctx: Context, app: Application) => Promise<QueryOptions>)): Promise<any[]> {
    this.checkEntity();

    const sql = await this.makeQuerySql(query, options);

    return await this.dataSourceQuery(sql, []);
  }

  /**
   * 分页查询数据。
   *
   * @param query - 查询参数对象。
   * @param options - 查询选项或返回查询选项的函数。
   * @returns 分页查询结果对象。
   */
  async page(query: PageDTO = { page: 1, size: 20 }, options?: QueryOptions | ((ctx: Context, app: Application) => Promise<QueryOptions>)) {
    this.checkEntity();

    const sql = await this.makeQuerySql(query, options);

    return await this.dataPagingQuery(sql, query);
  }

  /**
   * 查询数据详情。
   *
   * @param id - 数据ID。
   * @param omit - 需要排除的字段数组。
   * @returns 数据详情对象。
   */
  async detail(id: string, omit: string[] = []) {
    this.checkId(id);
    this.checkEntity();

    let find = await this.entity.findOneBy({ id });

    if (isEmpty(find)) throw new FailError(ResponseMessage.NotFound);

    // 如果指定了需要排除的字段，则过滤这些字段
    if (isObject(find) && isNoEmpty(omit)) {
      find = _.omit(find, omit);
    }

    return find;
  }

  /**
   * 更新数据。
   *
   * @param data - 要更新的数据对象，必须包含id字段。
   */
  async update(data: UpdateDTO) {
    this.checkId(data.id);
    this.checkEntity();

    const find = await this.entity.findOneBy({ id: data.id });

    if (isEmpty(find)) throw new FailError(ResponseMessage.NotFound);

    // 合并原数据和新数据
    data = _.merge(find, data);
    data.updateTime = new Date();

    return await this.entity.save(data);
  }

  /**
   * 删除数据。
   *
   * @param id - 要删除的记录ID或ID数组。
   */
  async delete(id: string | string[]) {
    this.checkEntity();

    let arr: string[] = [];

    if (isArray(id)) {
      arr = id;
    } else if (typeof id === 'string') {
      // 解析逗号分隔的 ID 字符串
      arr = id
        .split(',')
        .map(v => v.trim())
        .filter(v => v);
    }

    if (arr.length === 0) throw new ParamMissingError(ResponseMessage.NoId);

    return await this.entity.delete(arr);
  }

  /**
   * 软删除数据。
   *
   * @param id - 要删除的记录ID或ID数组。
   */
  async softDelete(id: string | string[]) {
    this.checkEntity();

    let arr: string[] = [];

    if (isArray(id)) {
      arr = id;
    } else if (typeof id === 'string') {
      // 解析逗号分隔的 ID 字符串
      arr = id
        .split(',')
        .map(v => v.trim())
        .filter(v => v);
    }

    if (arr.length === 0) throw new ParamMissingError(ResponseMessage.NoId);

    return await this.entity.softDelete(arr);
  }

  /**
   * 执行分页查询。
   *
   * @param sql - SQL查询语句。
   * @param query - 查询参数对象。
   * @returns 分页查询结果对象。
   */
  async dataPagingQuery(sql: string, query: Record<string, any> = {}) {
    const { size = 20, page = 1, isExport = false, maxExportLimit } = query;

    let cutParams = 0;
    const paramCount = countSqlParameters(sql);

    // 处理导出限制
    if (isExport && maxExportLimit > 0) {
      this.sqlParams.push(parseInt(maxExportLimit));
      cutParams = 1;
      sql += ` LIMIT $${paramCount + 1}`;
    }

    // 处理普通分页
    if (!isExport) {
      this.sqlParams.push(parseInt(size));
      this.sqlParams.push((page - 1) * size);
      cutParams = 2;
      sql += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    }

    let params = [];
    params = params.concat(this.sqlParams);
    const result = await this.dataSourceQuery(sql, params);

    // 获取总数查询参数
    params = params.slice(0, -cutParams);
    const countResult = await this.dataSourceQuery(getCountSql(sql), params);

    return {
      list: result,
      page: parseInt(page),
      size: parseInt(size),
      total: parseInt(countResult[0] ? countResult[0].count : 0),
    };
  }

  /**
   * 执行数据源查询。
   *
   * @param sql - SQL查询语句。
   * @param params - 查询参数数组。
   * @returns 查询结果数组。
   */
  async dataSourceQuery(sql: string, params: any[] = []) {
    sql = addQuotesToIdentifiers(sql);
    if (isEmpty(params)) {
      params = this.sqlParams;
    }
    let newParams = [];

    // 处理参数占位符转换
    if (sql.includes('?')) {
      for (const item of params) {
        if (item instanceof Array) {
          const replaceStr = [];
          for (let i = 0; i < item.length; i++) {
            replaceStr.push('$' + (newParams.length + i + 1));
          }
          newParams.push(...item);
          sql = sql.replace('?', replaceStr.join(','));
        } else {
          sql = sql.replace('?', '$' + (newParams.length + 1));
          newParams.push(item);
        }
      }
    } else {
      newParams = params;
    }
    this.sqlParams = [];

    return await this.getDataSource().query(sql, newParams);
  }

  /**
   * 检查数据ID。
   *
   * @param id - 数据ID。
   */
  checkId(id: string | string[]) {
    if (isEmpty(id)) throw new ParamMissingError(ResponseMessage.NoId);
  }

  /**
   * 检查数据实体。
   */
  checkEntity() {
    if (isEmpty(this.entity)) throw new CoreError(ResponseMessage.NotFoundEntity);
  }

  /**
   * 获取数据源连接。
   *
   * @param name - 数据源名称。
   * @returns 数据源连接对象。
   */
  getDataSource(name: string = 'default') {
    return this.typeORM.getDataSource(name);
  }

  /**
   * 构建查询SQL语句。
   *
   * @param query - 查询参数对象。
   * @param options - 查询选项或返回查询选项的函数。
   * @returns 构建好的SQL查询语句。
   */
  async makeQuerySql(query: Record<string, any>, options?: QueryOptions | ((ctx: Context, app: Application) => Promise<QueryOptions>)) {
    let { order = 'createTime', sort = 'desc', keyWord = '' } = query;

    const sqls = ['SELECT'];
    const selects = ['a.*'];
    const queryBuilder = this.entity.createQueryBuilder('a');

    // 处理函数形式的选项
    if (isFunction(options)) {
      options = await options(this.ctx, this.app);
    }

    if (isObject(options)) {
      // 处理关联查询
      if (isNoEmpty(options.joins)) {
        for (const join of options.joins) {
          selects.push(`${join.alias}.*`);
          queryBuilder[join.type || 'leftJoin'](join.entity, join.alias, join.condition);
        }
      }

      // 处理查询条件
      if (isNoEmpty(options.where)) {
        const wheres = isFunction(options.where) ? await options.where(this.ctx, this.app) : options.where;
        if (isNoEmpty(wheres)) {
          for (const item of wheres) {
            if (item.length > 1) {
              for (const key in item[1]) {
                this.sqlParams.push(item[1][key]);
              }
              queryBuilder.andWhere(item[0], item[1]);
            }
          }
        }
      }

      // 处理排序条件
      if (isNoEmpty(options.orderBy)) {
        for (const key in options.orderBy) {
          if (order === key) {
            sort = options.orderBy[key].toUpperCase();
          }
          const table = getTableAliasByField(options?.select, key);
          queryBuilder.addOrderBy(`${table}.${key}`, validateOrderBy(options.orderBy[key].toUpperCase() as 'DESC' | 'ASC'));
        }
      }

      // 处理关键字查询
      if (isNoEmpty(keyWord)) {
        validateKeyWord(keyWord);

        const searchPattern = `%${keyWord}%`;
        queryBuilder.andWhere(
          new Brackets(qb => {
            const searchFields = options.keyWordFields || [];
            searchFields.forEach((field, i) => {
              const column = field.includes('.') ? field : `a.${field}`;
              qb.orWhere(`${column} like :keyWord${i}`, { [`keyWord${i}`]: searchPattern });
              this.sqlParams.push(keyWord);
            });
          })
        );
      }

      // 处理查询字段
      if (isNoEmpty(options.select)) {
        sqls.push(options.select.join(','));
        queryBuilder.select(options.select);
      } else {
        sqls.push(selects.join(','));
      }

      // 处理匹配字段（精确匹配）
      if (isNoEmpty(options.equalFields)) {
        for (let field of options.equalFields) {
          let param: string;
          let column: string;

          if (typeof field === 'string') {
            column = field.includes('.') ? field : `a.${field}`;
            param = field.includes('.') ? field.split('.').pop() : field;
          } else {
            column = field.column;
            param = field.param;
          }

          const value = query[param];
          if (isDef(value)) {
            const c: Record<string, any> = { [param]: value };
            const operator = Array.isArray(value) ? 'IN' : '=';

            if (operator === 'IN') {
              queryBuilder.andWhere(`${column} IN (:...${param})`, c);
            } else {
              queryBuilder.andWhere(`${column} = :${param}`, c);
            }

            this.sqlParams.push(value);
          }
        }
      }

      // 处理模糊字段（LIKE查询）
      if (isNoEmpty(options.likeFields)) {
        for (const field of options.likeFields) {
          let column: string;
          let param: string;

          if (typeof field === 'string') {
            column = field.includes('.') ? field : `a.${field}`;
            param = field.includes('.') ? field.split('.').pop()! : field;
          } else {
            column = field.column;
            param = field.param;
          }

          const value = query[param];
          if (isDef(value)) {
            queryBuilder.andWhere(`${column} LIKE :${param}`, { [param]: `%${value}%` });
            this.sqlParams.push(value);
          }
        }
      }
    } else {
      sqls.push(selects.join(','));
    }

    // 处理排序
    if (sort && order) {
      const sorts = sort.toUpperCase().split(',');
      const orders = order.split(',');
      if (sorts.length !== orders.length) {
        throw new ParamError(ResponseMessage.SortParamError);
      }
      for (const i in sorts) {
        const table = getTableAliasByField(options?.select, orders[i]);
        queryBuilder.addOrderBy(`${table}.${orders[i]}`, validateOrderBy(sorts[i]));
      }
    }

    // 执行查询前的回调
    if (isFunction(options?.beforeQuery)) {
      await options.beforeQuery(queryBuilder, this.ctx, this.app);
    }

    const querySqls = queryBuilder.getSql().split('FROM ');

    sqls.push('FROM');
    sqls.push(querySqls[querySqls.length - 1]);

    // 处理ORDER BY前缀替换
    sqls.forEach((item, index) => {
      if (item.includes('ORDER BY')) {
        sqls[index] = replaceOrderByPrefix(item);
      }
    });

    return sqls.join(' ');
  }

  /**
   * 构建计数查询SQL语句。
   *
   * @param sql - 原始SQL查询语句。
   * @returns 计数查询SQL语句。
   */
  makeCountSql(sql: string) {
    sql = sql.replace(/LIMIT/gim, 'limit ').replace(/\s+/gm, ' ').trim();

    // 移除LIMIT和OFFSET子句
    if (sql.includes('limit')) {
      sql = sql.replace(/\s+limit\s+\d+(\s+offset\s+\d+)?\s*$/i, '').trim();
    }

    return `SELECT COUNT(*) AS count FROM (${sql}) AS subquery`;
  }
}
