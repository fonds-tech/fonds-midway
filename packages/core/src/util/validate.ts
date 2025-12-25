import { ParamError } from '../error/param';

/**
 * 验证关键字参数
 *
 * @param value - 要验证的关键字字符串
 * @returns 验证通过的关键字
 * @throws {ParamError} 当关键字长度超过10个字符时
 * @throws {ParamError} 当关键字包含非法字符时（只允许字母、数字、下划线）
 */
export function validateKeyWord(value: string) {
  if (value.length > 10) {
    throw new ParamError('keyWord 参数过长');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    throw new ParamError('keyWord 参数包含非法字符');
  }

  return value;
}

/**
 * 验证排序参数
 *
 * @param value - 排序方向，只能是 'DESC' 或 'ASC'
 * @returns 验证通过的排序参数
 * @throws {ParamError} 当排序参数不是 'DESC' 或 'ASC' 时
 */
export function validateOrderBy(value: 'DESC' | 'ASC') {
  if (!['DESC', 'ASC'].includes(value.toUpperCase())) {
    throw new ParamError('sort 参数错误');
  }
  return value;
}

/**
 * 验证 SQL 语句
 *
 * @param sql - 要验证的 SQL 语句
 * @returns 验证通过的 SQL 语句
 * @throws {ParamError} 当 SQL 语句包含危险操作关键字时
 */
export function validateSql(sql: string) {
  const s = sql.toLowerCase();
  const bad = s.indexOf('update ') > -1 || s.indexOf('select ') > -1 || s.indexOf('delete ') > -1 || s.indexOf('insert ') > -1;

  if (bad) {
    throw new ParamError('非法传参');
  }

  return sql;
}
