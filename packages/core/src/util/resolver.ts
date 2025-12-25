import * as fs from 'fs';
import * as path from 'path';

/**
 * 脚本信息接口，描述控制器文件的路径和模块信息。
 */
export interface Script {
  dirs: string[];
  path: string;
  file: string;
  rootPath: string;
  modulePath: string;
  moduleName: string;
  controllerName: string;
}

/**
 * 解析器类，用于解析控制器文件的路径和模块信息。
 */
class Resolver {
  rootPath: string;
  controllers = new Map<string, Script>();

  /**
   * 解析控制器类的脚本信息。
   *
   * @param target - 控制器类的构造函数。
   * @returns 包含控制器文件路径和模块信息的脚本对象。
   */
  controller(target: Function): Script {
    const name = target.name;
    // 匹配控制器文件路径的正则表达式
    const inControllerFile = /\/controller\/.*\.(ts|js)$/i;

    // 如果已缓存该控制器的脚本信息，直接返回
    if (this.controllers.has(name)) return this.controllers.get(name);

    let script = { path: '', file: '' } as Script;
    const original = Error.prepareStackTrace;

    try {
      // 自定义错误堆栈格式以获取调用栈信息
      Error.prepareStackTrace = (_, stack) => stack;
      const stack = new Error().stack as any;
      const scripts = stack
        .map((site: NodeJS.CallSite) => ({
          path: site.getFileName(),
          file: `file://${site.getFileName()}`,
        }))
        .filter((script: Script) => inControllerFile.test(script.path))
        .filter((script: Script) => fs.existsSync(script.path));

      if (scripts?.length) {
        // 取最后一个匹配的控制器文件
        script = scripts[scripts.length - 1];
        this.rootPath = this.findRootPath(script.path);
        script.rootPath = this.findRootPath(script.path);
        script.modulePath = this.findModulePath(script.path);
        script.moduleName = script.modulePath ? script.modulePath.split('/').pop() : '';
        script.controllerName = this.findControllerName(script.path);
        script.dirs = this.findDirs(script);
      }

      return script;
    } finally {
      // 恢复原始的错误堆栈格式
      Error.prepareStackTrace = original;
    }
  }

  /**
   * 根据脚本信息生成目录结构数组。
   *
   * @param script - 脚本信息对象。
   * @returns 目录结构数组。
   */
  findDirs(script: Script): string[] {
    const { path, rootPath, modulePath, moduleName, controllerName } = script;
    const p = path.split(modulePath ? modulePath : rootPath)[1];
    const arr = p.split('/').filter(Boolean);
    // 移除 controller 目录层级
    if (arr?.[0] === 'controller') arr.shift();
    // 移除文件名
    arr.pop();
    // 添加模块名到开头
    if (moduleName) arr.unshift(moduleName);
    // 添加控制器名到末尾
    if (controllerName) arr.push(controllerName);
    return arr;
  }

  /**
   * 查找项目根路径，基于 package.json 文件的位置。
   *
   * @param startPath - 开始查找的路径。
   * @returns 项目根路径，如果未找到则返回 null。
   */
  findRootPath(startPath: string): string | null {
    if (this.rootPath) return this.rootPath;

    let currentPath = fs.existsSync(startPath) && fs.lstatSync(startPath).isDirectory() ? startPath : path.dirname(startPath);

    while (true) {
      const pkgPath = path.join(currentPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        // 计算 startPath 相对于 package.json 所在目录的相对路径
        const relPath = path.relative(currentPath, startPath);
        const segments = relPath.split(path.sep).filter(Boolean);

        if (segments.length > 0) {
          return path.join(currentPath, segments[0]); // 返回完整路径
        } else {
          return currentPath; // 就在 package.json 目录下
        }
      }

      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) {
        break; // 已经到根目录了
      }
      currentPath = parentPath; // 继续往上
    }

    return null;
  }

  /**
   * 查找模块路径，基于 config.js 或 config.ts 文件的位置。
   *
   * @param startPath - 开始查找的路径。
   * @returns 模块路径，如果未找到则返回 null。
   */
  findModulePath(startPath: string): string | null {
    let currentPath = fs.existsSync(startPath) && fs.lstatSync(startPath).isDirectory() ? startPath : path.dirname(startPath);

    while (true) {
      const configJs = path.join(currentPath, 'config.js');
      const configTs = path.join(currentPath, 'config.ts');

      if (fs.existsSync(configJs) || fs.existsSync(configTs)) {
        return currentPath; // 找到了模块目录
      }

      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) {
        break; // 到根目录还没找到
      }
      currentPath = parentPath; // 往上
    }

    return null;
  }

  /**
   * 从文件路径中提取控制器名称。
   *
   * @param path - 文件路径。
   * @returns 控制器名称。
   */
  findControllerName(path: string) {
    const fileName = path.split('/').pop();
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return nameWithoutExt.split('.')[0];
  }
}

/**
 * 全局解析器实例。
 */
export const resolver = new Resolver();
