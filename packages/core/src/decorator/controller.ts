import type { ControllerOptions } from '../interface';
import _ from 'lodash';
import * as fs from 'fs';
import { resolver } from '../util/resolver';
import { CrudDescription, CrudRequestMethod } from '../enum/crud';
import { isEmpty, isString, isObject, isNoEmpty } from '../util/is';
import { saveModule, saveClassMetadata, getClassMetadata, attachClassMetadata, UseGuard, Provide, Scope, ScopeEnum, WEB_ROUTER_KEY, CONTROLLER_KEY } from '@midwayjs/core';

/**
 * 控制器装饰器，用于标记和配置控制器类。
 *
 * @param options - 控制器选项，可以是字符串（前缀）或控制器配置对象。
 * @returns 类装饰器函数。
 */
export function Controller(options?: string | ControllerOptions): ClassDecorator {
  return (target: any) => {
    // 保存控制器模块
    saveModule(CONTROLLER_KEY, target);

    let controllerOptions: ControllerOptions = { middleware: [], sensitive: true, organization: true };

    // 如果选项是字符串，则作为前缀处理
    if (isString(options)) {
      controllerOptions.prefix = options;
    }

    // 如果选项是对象，则合并到最终选项中
    if (isObject(options)) {
      controllerOptions = { ...controllerOptions, ...options };
      if ('prefix' in options) {
        controllerOptions.prefix = options.prefix || '';
      }
    }

    // 如果没有设置前缀，则根据文件位置自动生成
    if (isEmpty(controllerOptions.prefix)) {
      const script = resolver.controller(target);

      if (isEmpty(script.dirs)) return;
      // 如果最后一个目录是index，则移除它
      if (script.dirs[script.dirs.length - 1] === 'index') {
        script.dirs.pop();
      }
      // 根据目录结构和文件名生成前缀
      controllerOptions.prefix = `/${script.dirs.join('/')}`;
      // 如果存在模块路径，尝试加载配置文件
      if (script.modulePath) {
        const ext = script.path.endsWith('ts') ? 'ts' : 'js';
        const path = `${script.modulePath}/config.${ext}`;
        if (fs.existsSync(path)) {
          const config: any = require(path).default();
          controllerOptions.module = script.moduleName;
          // 合并守卫
          controllerOptions.guard = [].concat(config.guard || []).concat(controllerOptions.guard || []);
          // 合并中间件配置
          controllerOptions.middleware = (config.middlewares || []).concat(controllerOptions.middleware || []);
        }
      }
    }
    saveMetadata(target, controllerOptions);
  };
}

/**
 * 保存控制器元数据并配置路由信息。
 *
 * @param target - 目标控制器类。
 * @param options - 控制器配置选项。
 */
function saveMetadata(target: any, options: ControllerOptions) {
  if (options.module && !options.tagName) {
    options.tagName = options.module;
  }
  // 保存控制器元数据
  saveClassMetadata(
    CONTROLLER_KEY,
    {
      ...options,
      routerOptions: _.pick(options, ['alias', 'sensitive', 'middleware', 'description', 'tagName', 'ignoreGlobalPrefix']),
    },
    target
  );

  // 如果配置了 API，则为每个 API 生成路由
  if (isNoEmpty(options.api)) {
    const routes = getClassMetadata(WEB_ROUTER_KEY, target) || [];
    const paths = routes.map((route: any) => route.path);

    options.api.forEach(api => {
      const path = `/${api}`;
      const method = api;
      const description = CrudDescription[api] ?? api;
      const requestMethod = CrudRequestMethod[api] ?? 'post';

      if (paths.includes(path)) return;

      attachClassMetadata(WEB_ROUTER_KEY, { path, method, description, requestMethod }, target);
    });
  }

  Provide()(target);
  Scope(ScopeEnum.Request)(target);
  if (isNoEmpty(options.guard)) {
    UseGuard(options.guard)(target);
  }
}
