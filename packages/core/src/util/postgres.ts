/**
 * 替换 SQL 语句中 ORDER BY 子句的字段前缀
 * 将 ORDER BY 子句中的字段前缀从 "a_" 替换为 "a."，并移除双引号
 *
 * @param sql - 要处理的 SQL 语句
 * @returns 处理后的 SQL 语句
 */
export function replaceOrderByPrefix(sql: string): string {
  const orderByRegex = /ORDER BY\s+([\s\S]+)/i;

  const match = sql.match(orderByRegex);
  if (!match) return sql;

  const orderByFields = match[1]
    .split(',')
    .map(field => field.trim().replace(/\ba_/, 'a.'))
    .join(', ');

  return sql.replace(orderByRegex, `ORDER BY ${orderByFields}`);
}

/**
 * 为 SQL 语句中的表名和字段名添加双引号
 * 用于确保在 PostgreSQL 中正确处理标识符
 *
 * @param sql - 要处理的 SQL 语句
 * @returns 处理后的 SQL 语句
 */
export function addQuotesToIdentifiers(sql: string): string {
  sql = sql.replace(/(?<!")(\b\w+\b)\.(?!\w+")/g, '"$1".');
  return sql.replace(/\.(\w+)(?!\w)/g, '."$1"');
}

/**
 * 计算 SQL 语句中参数占位符的数量
 * 统计形如 $1, $2, $3 等参数占位符的总数
 *
 * @param sql - 要分析的 SQL 语句
 * @returns 参数占位符的数量
 */
export function countSqlParameters(sql: string): number {
  const matches = sql.match(/\$\d+/g);
  return matches ? matches.length : 0;
}

/**
 * 获取用于计数的 SQL 语句
 * 从原始查询 SQL 中移除 LIMIT 子句，并包装为 COUNT 查询
 *
 * @param sql - 原始查询 SQL 语句
 * @returns 用于计数的 SQL 语句
 */
export function getCountSql(sql: string): string {
  sql = sql.replace(new RegExp('LIMIT', 'gm'), 'limit ').replace(new RegExp('\n', 'gm'), ' ');
  if (sql.includes('limit')) {
    const sqlArr = sql.split('limit ');
    sqlArr.pop();
    sql = sqlArr.join('limit ');
  }
  return `select count(*) as count from (${sql}) a`;
}
