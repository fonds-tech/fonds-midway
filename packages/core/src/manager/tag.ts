import _ from 'lodash';
import { METHOD_TAG_KEY } from '../decorator/tag';
import { listModule, listPropertyDataFromClass, getClassMetadata, Init, Provide, Scope, ScopeEnum, WEB_ROUTER_KEY, CONTROLLER_KEY } from '@midwayjs/core';

/**
 * 标签管理器，用于管理和组织方法标签与路由路径的映射关系。
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class TagManager {
  /** 存储标签数据的对象，以嵌套结构组织标签与路径的映射 */
  tag: Record<string, any> = {};

  /**
   * 初始化标签管理器。
   */
  @Init()
  async init() {
    await this.initMethodTag();
  }

  /**
   * 初始化方法标签，扫描所有控制器并构建标签与路由路径的映射关系。
   */
  async initMethodTag() {
    // 获取所有控制器模块
    const controllers = listModule(CONTROLLER_KEY);
    for (const controller of controllers) {
      // 获取控制器的路由元数据
      const routerMetadatas = getClassMetadata(WEB_ROUTER_KEY, controller);
      const controllerMetadata = getClassMetadata(CONTROLLER_KEY, controller);
      // 获取控制器中带有方法标签的属性元数据
      const listPropertyMetas = listPropertyDataFromClass(METHOD_TAG_KEY, controller);
      for (const propertyMeta of listPropertyMetas) {
        // 查找对应方法的路由元数据
        const routerMetadata = _.find(routerMetadatas, { method: propertyMeta.key });
        if (routerMetadata && controllerMetadata) {
          // 构建完整的路由路径
          const fullPath = `${controllerMetadata.prefix || ''}${routerMetadata.path || ''}`;

          // 处理标签，可能是字符串或数组
          const tags = Array.isArray(propertyMeta.tag) ? propertyMeta.tag : [propertyMeta.tag];

          for (const tag of tags) {
            // 将标签按点号分割成层级结构
            const tagParts = tag.split('.');

            // 构建嵌套的标签数据结构
            let current = this.tag;
            for (let i = 0; i < tagParts.length; i++) {
              const part = tagParts[i];
              if (i === tagParts.length - 1) {
                // 最后一级，存储路径数组
                if (!current[part]) {
                  current[part] = [];
                }
                if (!current[part].includes(fullPath)) {
                  current[part].push(fullPath);
                }
              } else {
                // 中间层级，创建嵌套对象
                if (!current[part]) {
                  current[part] = {};
                }
                current = current[part];
              }
            }
          }
        }
      }
    }
  }

  /**
   * 获取标签数据。
   * @returns 标签数据。
   */
  getTag() {
    return this.tag;
  }
}
