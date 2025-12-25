import type { Repository } from 'typeorm';
import type { QueryOptions } from '../interface';
import type { Context, Application } from '@midwayjs/koa';
import { CoreError } from '../error/core';
import { PostgresService } from './postgres';
import { ResponseMessage } from '../enum/response';
import { isArray, isEmpty } from '../util/is';
import { ParamMissingError } from '../error/param';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { ListDTO, PageDTO, CreateDTO, UpdateDTO } from '../dto/base';
import { App, Init, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';

/**
 * 基础服务类，提供通用的 CRUD 操作。
 */
@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export abstract class BaseService {
  @App()
  app: Application;

  @Inject()
  ctx: Context;

  @Inject()
  service: PostgresService;

  entity: Repository<any>;

  typeORM: TypeORMDataSourceManager;

  /**
   * 初始化服务，根据数据源类型设置对应的服务实例。
   */
  @Init()
  async init() {
    if (this.app.getApplicationContext().hasNamespace('typeorm')) {
      this.typeORM = await this.app.getApplicationContext().getAsync(TypeORMDataSourceManager);
    }

    await this.service.init();
  }

  /**
   * 设置上下文对象。
   *
   * @param ctx - 请求上下文对象。
   */
  setCtx(ctx: Context) {
    this.ctx = ctx;
    this.service.setCtx(ctx);
  }

  /**
   * 设置应用程序对象。
   *
   * @param app - 应用程序实例。
   */
  setApp(app: Application) {
    this.app = app;
    this.service.setApp(app);
  }

  /**
   * 设置数据库实体。
   *
   * @param entity - 数据库实体仓库。
   */
  setEntity(entity: any) {
    this.entity = entity;
    this.service.setEntity(entity);
  }

  /**
   * 添加数据。
   *
   * @param data - 要添加的数据对象。
   * @returns 包含新增数据 ID 的对象。
   */
  async create(data: CreateDTO): Promise<Object> {
    if (isEmpty(this.entity)) throw new CoreError(ResponseMessage.NotFoundEntity);

    delete data.id;
    delete data.createTime;
    delete data.updateTime;

    this.service.setEntity(this.entity);

    const result = await this.service.create(data);

    return { id: result.id };
  }

  /**
   * 查询数据列表。
   *
   * @param query - 查询参数。
   * @param options - 查询选项或返回查询选项的函数。
   * @returns 查询结果列表。
   */
  async list(query: ListDTO, options?: QueryOptions | ((ctx: Context, app: Application) => Promise<QueryOptions>)) {
    if (isEmpty(this.entity)) throw new CoreError(ResponseMessage.NotFoundEntity);

    this.service.setEntity(this.entity);

    return await this.service.list(query, options);
  }

  /**
   * 分页查询数据。
   *
   * @param query - 查询参数。
   * @param options - 查询选项或返回查询选项的函数。
   * @returns 分页查询结果。
   */
  async page(query: PageDTO = { page: 1, size: 20 }, options?: QueryOptions | ((ctx: Context, app: Application) => Promise<QueryOptions>)) {
    if (isEmpty(this.entity)) throw new CoreError(ResponseMessage.NotFoundEntity);

    this.service.setEntity(this.entity);
    return await this.service.page(query, options);
  }

  /**
   * 获取数据详情。
   *
   * @param id - 数据 ID。
   * @param omit - 需要排除的字段数组。
   * @returns 数据详情对象。
   */
  async detail(id: string, omit: string[] = []) {
    if (isEmpty(this.entity)) throw new CoreError(ResponseMessage.NotFoundEntity);

    this.service.setEntity(this.entity);
    return await this.service.detail(id, omit);
  }

  /**
   * 更新数据。
   *
   * @param data - 要更新的数据对象，必须包含 ID。
   * @returns 更新操作结果。
   */
  async update(data: UpdateDTO) {
    if (isEmpty(data.id)) throw new ParamMissingError(ResponseMessage.NoId);
    if (isEmpty(this.entity)) throw new CoreError(ResponseMessage.NotFoundEntity);

    delete data.createTime;
    this.service.setEntity(this.entity);
    return await this.service.update(data);
  }

  /**
   * 删除数据。
   *
   * @param id - 要删除的记录ID或ID数组。
   * @returns 删除操作结果。
   */
  async delete(id: string | string[]) {
    if (isEmpty(this.entity)) throw new CoreError(ResponseMessage.NotFoundEntity);

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

    this.service.setEntity(this.entity);

    await this.beforeDelete(arr);
    const result = await this.service.delete(arr);
    await this.afterDelete(arr);

    return result;
  }

  /**
   * 软删除数据。
   *
   * @param id - 要删除的记录ID或ID数组。
   * @returns 删除操作结果。
   */
  async softDelete(id: string | string[]) {
    if (isEmpty(this.entity)) throw new CoreError(ResponseMessage.NotFoundEntity);

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

    this.service.setEntity(this.entity);

    await this.beforeDelete(arr);
    const result = await this.service.softDelete(arr);
    await this.afterDelete(arr);

    return result;
  }

  async afterDelete(id: string[]): Promise<void> {}
  async beforeDelete(id: string[]): Promise<void> {}
}
