import _ from 'lodash';
import { CASBIN_KEY, CasbinOptions } from '../decorator/casbin';
import { listModule, listPropertyDataFromClass, getClassMetadata, Init, Provide, Scope, ScopeEnum, WEB_ROUTER_KEY, CONTROLLER_KEY } from '@midwayjs/core';

/**
 * 权限管理器类，用于管理和初始化API接口的权限配置。
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class CasbinManager {
  data: Record<string, CasbinOptions> = {};

  /**
   * 初始化方法，在类实例化时自动调用。
   */
  @Init()
  async init() {
    await this.initCasbin();
  }

  /**
   * 初始化Casbin配置，扫描所有控制器并提取Casbin信息。
   */
  async initCasbin() {
    // 获取所有控制器模块
    const controllers = listModule(CONTROLLER_KEY);
    for (const controller of controllers) {
      // 获取控制器的路由元数据
      const routerMetadatas = getClassMetadata(WEB_ROUTER_KEY, controller);
      const controllerMetadata = getClassMetadata(CONTROLLER_KEY, controller);
      // 获取控制器中带有方法标签的属性元数据
      const listPropertyMetas = listPropertyDataFromClass(CASBIN_KEY, controller);
      for (const propertyMeta of listPropertyMetas) {
        // 查找对应方法的路由元数据
        const routerMetadata = _.find(routerMetadatas, { method: propertyMeta.key });
        if (routerMetadata && controllerMetadata) {
          // 构建完整的路由路径
          const fullPath = `${controllerMetadata.prefix || ''}${routerMetadata.path || ''}`;
          this.data[fullPath] = propertyMeta.options;
        }
      }
    }
  }
}
