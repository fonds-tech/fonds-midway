import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

/**
 * 实体文件生成器选项
 */
interface EntityGeneratorOptions {
  /**
   * 输出文件路径，默认为 'src/entities.ts'
   */
  outputFile?: string;
  /**
   * 实体源文件目录，默认为 'src'
   */
  sourceDir?: string;
  /**
   * 当前工作目录，默认为 process.cwd()
   */
  cwd?: string;
}

/**
 * 默认选项
 */
const DEFAULT_OPTIONS: Required<EntityGeneratorOptions> = {
  outputFile: 'src/entities.ts',
  sourceDir: 'src',
  cwd: process.cwd(),
};

/**
 * 文件头部注释
 */
const FILE_HEADER = `// 自动生成的文件，请勿手动修改
`;

/**
 * 合并用户选项和默认选项
 * @param options 用户传入的选项
 * @returns 合并后的选项
 */
function resolveOptions(options: EntityGeneratorOptions = {}): Required<EntityGeneratorOptions> {
  return {
    outputFile: options.outputFile ?? DEFAULT_OPTIONS.outputFile,
    sourceDir: options.sourceDir ?? DEFAULT_OPTIONS.sourceDir,
    cwd: options.cwd ?? DEFAULT_OPTIONS.cwd,
  };
}

/**
 * 异步生成 entities.ts 文件
 * @param options 实体生成器选项
 */
export async function generateEntitiesFile(options: EntityGeneratorOptions = {}): Promise<void> {
  const opts = resolveOptions(options);

  try {
    // 查找所有 entity 文件
    const entityFiles = glob.sync('**/*.entity.ts', {
      cwd: path.resolve(opts.cwd, opts.sourceDir),
      absolute: true,
    });

    if (entityFiles.length === 0) {
      console.warn('未找到任何实体文件，目录：', path.resolve(opts.cwd, opts.sourceDir));
      return;
    }

    const outputPath = path.resolve(opts.cwd, opts.outputFile);
    const outputDir = path.dirname(outputPath);

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 生成 import 语句
    const imports = entityFiles.map((file, index) => {
      const relativePath = path.relative(outputDir, file).split(path.sep).join('/');
      return `import * as entity${index} from './${relativePath.replace(/\.ts$/, '')}';`;
    });

    // 生成 entities 导出数组
    const exportEntities = `export const entities = [
  ${entityFiles.map((_, index) => `...Object.values(entity${index})`).join(',\n  ')},
];`;

    // 拼接最终文件内容
    const fileContent = `${FILE_HEADER}
${imports.join('\n')}

${exportEntities}
`;

    // 写入文件
    fs.writeFileSync(outputPath, fileContent, 'utf8');
    console.log(`✅ 实体文件生成成功: ${outputPath}`);
    console.log(`📊 共找到 ${entityFiles.length} 个实体文件`);
  } catch (error) {
    console.error('❌ 生成实体文件失败:', error);
    throw error;
  }
}

/**
 * 异步清空 entities.ts 文件
 * @param options 实体生成器选项
 */
export async function clearEntitiesFile(options: EntityGeneratorOptions = {}): Promise<void> {
  const opts = resolveOptions(options);

  try {
    const outputPath = path.resolve(opts.cwd, opts.outputFile);
    const emptyContent = `${FILE_HEADER}
export const entities = [];
`;

    fs.writeFileSync(outputPath, emptyContent, 'utf8');
    console.log(`✅ 实体文件已清空: ${outputPath}`);
  } catch (error) {
    console.error('❌ 清空实体文件失败:', error);
    throw error;
  }
}

/**
 * 同步生成 entities.ts 文件（向后兼容）
 * @param options 实体生成器选项
 */
export function generateEntitiesFileSync(options: EntityGeneratorOptions = {}): void {
  const opts = resolveOptions(options);

  try {
    // 查找所有 entity 文件
    const entityFiles = glob.sync('**/*.entity.ts', {
      cwd: path.resolve(opts.cwd, opts.sourceDir),
      absolute: true,
    });

    if (entityFiles.length === 0) {
      console.warn('未找到任何实体文件，目录：', path.resolve(opts.cwd, opts.sourceDir));
      return;
    }

    const outputPath = path.resolve(opts.cwd, opts.outputFile);
    const outputDir = path.dirname(outputPath);

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 生成 import 语句
    const imports = entityFiles.map((file, index) => {
      const relativePath = path.relative(outputDir, file).split(path.sep).join('/');
      return `import * as entity${index} from './${relativePath.replace(/\.ts$/, '')}';`;
    });

    // 生成 entities 导出数组
    const exportEntities = `export const entities = [
  ${entityFiles.map((_, index) => `...Object.values(entity${index})`).join(',\n  ')},
];`;

    // 拼接最终文件内容
    const fileContent = `${FILE_HEADER}
${imports.join('\n')}

${exportEntities}
`;

    fs.writeFileSync(outputPath, fileContent, 'utf8');
    console.log(`✅ 实体文件生成成功: ${outputPath}`);
    console.log(`📊 共找到 ${entityFiles.length} 个实体文件`);
  } catch (error) {
    console.error('❌ 生成实体文件失败:', error);
    throw error;
  }
}

/**
 * 同步清空 entities.ts 文件
 * @param options 实体生成器选项
 */
export function clearEntitiesFileSync(options: EntityGeneratorOptions = {}): void {
  const opts = resolveOptions(options);

  try {
    const outputPath = path.resolve(opts.cwd, opts.outputFile);
    const emptyContent = `${FILE_HEADER}
export const entities = [];
`;

    fs.writeFileSync(outputPath, emptyContent, 'utf8');
    console.log(`✅ 实体文件已清空: ${outputPath}`);
  } catch (error) {
    console.error('❌ 清空实体文件失败:', error);
    throw error;
  }
}
