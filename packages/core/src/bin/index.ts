#!/usr/bin/env node

/**
 * CLI 入口文件
 *
 * 提供 entity 相关命令行工具：
 * - 生成 entities.ts 文件
 * - 清空 entities.ts 文件
 *
 * 支持参数：
 *   --clear   清空 entities 文件
 *   --output  指定输出文件路径（默认 src/entities.ts）
 *   --source  指定实体源目录（默认 src）
 */

import { Command } from 'commander';
import { generateEntitiesFileSync, clearEntitiesFileSync } from './entity';

const program = new Command();

// 设置 CLI 版本号，读取 package.json 中的 version 字段
program.version(require('../../package.json').version);

// 命令集合，目前仅支持 entity 命令
const commands = {
  /**
   * entity 命令处理函数
   * @param options 命令行参数
   *   - clear: 是否清空 entities 文件
   *   - output: 输出文件路径
   *   - source: 实体源目录
   */
  entity: async (options: { clear?: boolean; output?: string; source?: string } = {}) => {
    const entityOptions = {
      outputFile: options.output,
      sourceDir: options.source,
    };

    if (options.clear) {
      // 清空 entities 文件
      clearEntitiesFileSync(entityOptions);
    } else {
      // 生成 entities 文件
      generateEntitiesFileSync(entityOptions);
    }
  },
};

// 配置命令行参数和描述
program
  .arguments('[cmds...]')
  .option('--clear', 'Clear entities file when using entity command')
  .option('--output <path>', 'Output file path (default: src/entities.ts)')
  .option('--source <path>', 'Source directory path (default: src)')
  .description('Run one or multiple commands: entity')
  .action(async (cmds: string[], options) => {
    if (cmds.length) {
      // 依次执行传入的命令
      for (const cmd of cmds) {
        if (cmd in commands) {
          console.log(`Executing ${cmd}...`);
          await commands[cmd](options);
        } else {
          console.error(`Unknown command: ${cmd}`);
        }
      }
    } else {
      // 未传入命令时输出帮助信息
      program.outputHelp();
    }
  });

// 解析命令行参数
program.parse(process.argv);

// 如果没有传入任何参数，则输出帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
