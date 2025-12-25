import type { IMidwayContainer } from '@midwayjs/core';
import type { ControllerOptions } from '../interface';
import type { Context, Application } from '@midwayjs/koa';
import _ from 'lodash';
import { BaseService } from '../service/base';
import { ListVO, PageVO, DetailVO } from '../vo';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { ResponseCode, ResponseMessage } from '../enum/response';
import { isArray, isFunction, isNoEmpty } from '../util/is';
import { ListDTO, PageDTO, DeleteDTO, UpdateDTO, DetailDTO } from '../dto/base';
import { plainToInstance, ClassConstructor, ClassTransformOptions } from 'class-transformer';
import { App, Body, Query, Init, Inject, Provide, ApplicationContext, getClassMetadata, CONTROLLER_KEY } from '@midwayjs/core';

/**
 * 基础控制器类，提供通用的CRUD操作。
 */
@Provide()
export abstract class BaseController<T extends BaseService = BaseService> {
  @App()
  app: Application;

  @Inject()
  ctx: Context;

  @ApplicationContext()
  applicationContext: IMidwayContainer;

  typeORMDataSourceManager: TypeORMDataSourceManager;

  service: T;
  options: ControllerOptions;
  dataSourceName: string;

  /**
   * 初始化控制器，设置服务和实体。
   */
  @Init()
  async init() {
    if (this.app.getApplicationContext().hasNamespace('typeorm')) {
      this.typeORMDataSourceManager = await this.app.getApplicationContext().getAsync(TypeORMDataSourceManager);
    }

    this.options = getClassMetadata(CONTROLLER_KEY, this);
    this.service = await this.ctx.requestContext.getAsync('baseService');

    if (isNoEmpty(this.options)) {
      await this.setService(this.options);
      await this.setEntity(this.options);
    }
  }

  /**
   * 添加数据。
   *
   * @returns 包含添加结果的成功响应。
   */
  async create(@Body() _: any) {
    await this.beforeCreate(this.options);
    const { body } = this.ctx.request;
    return this.success(await this.service.create(body));
  }

  /**
   * 分页查询数据。
   *
   * @param body - 分页查询参数。
   * @returns 包含分页数据的成功响应。
   */
  async page(@Body() body: PageDTO) {
    const result = await this.service.page(body, this.options.pageQueryOptions);
    return this.success(this.vo(PageVO, result));
  }

  /**
   * 列表查询数据。
   *
   * @param body - 查询参数。
   * @returns 包含列表数据的成功响应。
   */
  async list(@Body() body: ListDTO) {
    const list = await this.service.list(body, this.options.listQueryOptions);
    return this.success(this.vo(ListVO, list));
  }

  /**
   * 删除数据。
   *
   * @param body - 删除参数，包含要删除的ID数组。
   * @returns 包含删除结果的成功响应。
   */
  async delete(@Body() body: DeleteDTO) {
    return this.success(await this.service.delete(body.id));
  }

  /**
   * 更新数据。
   *
   * @param body - 更新参数，包含要更新的数据。
   * @returns 包含更新结果的成功响应。
   */
  async update(@Body() body: UpdateDTO) {
    await this.service.update(body);
    return this.success();
  }

  /**
   * 获取详情数据。
   *
   * @param query - 详情查询参数，包含ID。
   * @returns 包含详情数据的成功响应。
   */
  async detail(@Query() query: DetailDTO) {
    const detail = await this.service.detail(query.id);
    return this.success(this.vo(DetailVO, detail));
  }

  /**
   * VO转换。
   *
   * @param cls - VO类
   * @param data - 转换数据。
   * @param options - 转换选项。
   * @returns 转换后的数据。
   */
  vo<T, V>(cls: ClassConstructor<T>, data: V, options?: ClassTransformOptions) {
    return plainToInstance(cls, data, options);
  }

  /**
   * 返回失败响应。
   *
   * @param message - 错误消息。
   * @param code - 错误代码。
   * @returns 失败响应对象。
   */
  fail(message?: string, code?: number) {
    return {
      code: code ?? ResponseCode.Fail,
      message: message ?? ResponseMessage.Fail,
    };
  }

  /**
   * 返回成功响应。
   *
   * @param data - 响应数据。
   * @returns 成功响应对象。
   */
  success<T = any>(data?: T) {
    const res: { code: number; message: string; data?: T } = { code: ResponseCode.Success, message: ResponseMessage.Success };
    if (data) {
      res.data = data;
    }
    return res;
  }

  /**
   * 设置实体模型。
   *
   * @param options - 控制器选项配置。
   */
  private async setEntity(options: ControllerOptions) {
    const entity = options?.entity;

    if (entity) {
      this.dataSourceName = this.typeORMDataSourceManager.getDataSourceNameByModel(entity);
      const entityModel = this.typeORMDataSourceManager.getDataSource(this.dataSourceName).getRepository(entity);
      this.service.setEntity(entityModel);
    }
  }

  /**
   * 设置服务实例。
   *
   * @param option - 控制器选项配置。
   */
  private async setService(option: ControllerOptions) {
    if (option.service) {
      this.service = await this.ctx.requestContext.getAsync(option.service);
    }
  }

  /**
   * 添加数据前的预处理操作。
   *
   * @param options - 控制器选项配置。
   */
  async beforeCreate(options: ControllerOptions) {
    if (isFunction(options.beforeCreate)) {
      const body = this.ctx.request.body;

      if (isNoEmpty(body)) {
        if (isArray(body)) {
          // 处理数组形式的批量添加
          for (let i = 0; i < body.length; i++) {
            body[i] = _.merge(body[i], options.beforeCreate(this.ctx, this.app));
          }
          this.ctx.request.body = body;
          return;
        }

        // 处理单个对象的添加
        this.ctx.request.body = _.merge(this.ctx.request.body, options.beforeCreate(this.ctx, this.app));
      }
    }
  }
}
