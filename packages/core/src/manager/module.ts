import { ModuleConfig } from '../interface';
import type { IMidwayApplication } from '@midwayjs/core';
import _ from 'lodash';
import * as path from 'path';
import { promises as fs } from 'fs';
import { isEmpty, isNoEmpty } from '../util/is';
import { ALL, App, Config, Init, Provide, Scope, ScopeEnum } from '@midwayjs/core';

/**
 * 模块信息接口。
 */
interface ModuleInfo {
  order: number;
  module: string;
}

/**
 * 全局中间件接口。
 */
interface GlobalMiddleware {
  order: number;
  data: any[];
}

/**
 * 模块管理器，负责加载和管理应用模块。
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class ModuleManager {
  @App()
  app: IMidwayApplication;

  @Config(ALL)
  config: Record<string, any>;

  private readonly modulesPath = path.join(process.cwd(), 'dist/modules');

  /**
   * 初始化模块管理器。
   */
  @Init()
  async init(): Promise<void> {
    try {
      await this.loadModules();
    } catch (error) {
      console.log(`模块加载失败: ${error.message}`);
    }
  }

  /**
   * 加载所有模块配置。
   */
  private async loadModules(): Promise<void> {
    // 检查模块目录是否存在
    if (!(await this.pathExists(this.modulesPath))) {
      return;
    }

    // 初始化模块配置
    this.initializeModuleConfig();

    const modules: ModuleInfo[] = [];
    const globalMiddlewares: GlobalMiddleware[] = [];

    // 读取模块目录
    const moduleNames = await this.getModuleNames();

    // 并发加载所有模块配置
    const moduleConfigs = await Promise.all(moduleNames.map(moduleName => this.loadModuleConfig(moduleName)));

    // 处理加载结果
    for (let i = 0; i < moduleNames.length; i++) {
      const moduleName = moduleNames[i];
      const moduleConfig = moduleConfigs[i];

      if (moduleConfig) {
        modules.push({
          order: moduleConfig.order || 0,
          module: moduleName,
        });

        await this.registerModuleConfig(moduleName, moduleConfig);

        // 收集全局中间件
        if (isNoEmpty(moduleConfig.globalMiddlewares)) {
          globalMiddlewares.push({
            order: moduleConfig.order || 0,
            data: moduleConfig.globalMiddlewares,
          });
        }
      }
    }

    // 应用全局中间件
    await this.applyGlobalMiddlewares(globalMiddlewares);
  }

  /**
   * 检查路径是否存在。
   *
   * @param filePath - 要检查的文件路径。
   * @returns 路径是否存在。
   */
  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 初始化模块配置对象。
   */
  private initializeModuleConfig(): void {
    if (isEmpty(this.config.module)) {
      this.config.module = {};
    }
  }

  /**
   * 获取所有模块名称。
   *
   * @returns 模块名称数组。
   */
  private async getModuleNames(): Promise<string[]> {
    const entries = await fs.readdir(this.modulesPath, { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
  }

  /**
   * 加载单个模块配置。
   *
   * @param moduleName - 模块名称。
   * @returns 模块配置对象或null。
   */
  private async loadModuleConfig(moduleName: string): Promise<ModuleConfig | null> {
    const modulePath = path.join(this.modulesPath, moduleName);
    const configPath = await this.findConfigFile(modulePath);

    if (!configPath) {
      console.log(`模块【${moduleName}】缺少config.ts或config.js配置文件`);
      return null;
    }

    try {
      // 清除 require 缓存以支持热重载
      delete require.cache[require.resolve(configPath)];

      const configModule = require(configPath);
      const configFactory = configModule.default || configModule;

      if (typeof configFactory !== 'function') {
        console.log(`模块【${moduleName}】配置文件必须导出一个函数`);
        return null;
      }

      return configFactory({
        app: this.app,
        env: this.app.getEnv(),
      }) as ModuleConfig;
    } catch (error) {
      console.log(`加载模块【${moduleName}】配置失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 查找模块配置文件。
   *
   * @param modulePath - 模块路径。
   * @returns 配置文件路径或null。
   */
  private async findConfigFile(modulePath: string): Promise<string | null> {
    const possiblePaths = [path.join(modulePath, 'config.ts'), path.join(modulePath, 'config.js')];

    for (const configPath of possiblePaths) {
      if (await this.pathExists(configPath)) {
        return configPath;
      }
    }

    return null;
  }

  /**
   * 注册模块配置。
   *
   * @param moduleName - 模块名称。
   * @param config - 模块配置对象。
   */
  private async registerModuleConfig(moduleName: string, config: ModuleConfig): Promise<void> {
    this.config.module[moduleName] = config;
  }

  /**
   * 应用全局中间件。
   *
   * @param middlewares - 全局中间件数组。
   */
  private async applyGlobalMiddlewares(middlewares: GlobalMiddleware[]): Promise<void> {
    if (middlewares.length === 0) return;

    // 按照 order 降序排列，order 值大的优先级高
    const sortedMiddlewares = _.orderBy(middlewares, ['order'], ['desc']);

    for (const middleware of sortedMiddlewares) {
      for (const item of middleware.data) {
        this.app.getMiddleware().insertLast(item);
      }
    }
  }

  /**
   * 获取模块配置。
   *
   * @deprecated 使用 registerModuleConfig 替代
   * @param module - 模块名称。
   * @param config - 模块配置对象。
   */
  async moduleConfig(module: string, config: ModuleConfig): Promise<void> {
    await this.registerModuleConfig(module, config);
  }

  /**
   * 处理全局中间件数组。
   *
   * @deprecated 使用 applyGlobalMiddlewares 替代
   * @param middlewares - 全局中间件数组。
   */
  async globalMiddlewareArr(middlewares: GlobalMiddleware[]): Promise<void> {
    await this.applyGlobalMiddlewares(middlewares);
  }
}
