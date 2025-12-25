/**
 * 判断值是否已定义且不为空字符串。
 *
 * @param value - 要检查的值。
 * @returns 如果值不是 undefined、null 或空字符串，则返回 true。
 */
export const isDef = <T>(value: T): value is NonNullable<T> => value !== undefined && value !== null && value !== '';

/**
 * 判断值是否为有效的日期格式。
 *
 * @param value - 要校验的日期值。
 * @returns 如果是有效日期格式则返回 true，否则返回 false。
 */
export function isDate(value: any): boolean {
  return !/Invalid|NaN/.test(new Date(value).toString());
}

/**
 * 判断值是否为整数。
 *
 * @param value - 要校验的值。
 * @returns 如果是整数则返回 true，否则返回 false。
 */
export function isDigits(value: any): boolean {
  return /^\d+$/.test(value);
}

/**
 * 判断值是否为有效的数字（支持整数、小数、千分位）。
 *
 * @param value - 要校验的值。
 * @returns 如果是有效数字则返回 true，否则返回 false。
 */
export function isNumber(value: any): boolean {
  return /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value);
}

/**
 * 判断值是否为字符串类型。
 *
 * @param value - 要检查的值。
 * @returns 如果是字符串类型则返回 true，否则返回 false。
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * 判断值是否为函数类型。
 *
 * @param value - 要检查的参数。
 * @returns 如果是函数则返回 true，否则返回 false。
 */
export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function';
}

/**
 * 判断值是否为布尔类型。
 *
 * @param value - 要校验的值。
 * @returns 如果是布尔类型则返回 true，否则返回 false。
 */
export function isBoolean(value: any): boolean {
  return typeof value === 'boolean';
}

/**
 * 判断值是否为 Promise 对象。
 *
 * @param val - 要校验的值。
 * @returns 如果是 Promise 对象则返回 true，否则返回 false。
 */
export function isPromise<T = any>(val: unknown): val is Promise<T> {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch);
}

/**
 * 判断值是否为 thenable 对象。
 *
 * @param wat - 要检查的值。
 * @returns 如果是 thenable 对象则返回 true，否则返回 false。
 */
export function isThenable(val: any): val is PromiseLike<any> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return Boolean(val?.then && typeof val.then === 'function');
}

/**
 * 判断值是否为数组。
 *
 * @param value - 要校验的值。
 * @returns 如果是数组则返回 true，否则返回 false。
 */
export function isArray(value: any): value is any[] {
  if (typeof Array.isArray === 'function') {
    return Array.isArray(value);
  } else {
    return Object.prototype.toString.call(value) === '[object Array]';
  }
}

/**
 * 判断值是否为对象（不包括 null）。
 *
 * @param value - 要校验的值。
 * @returns 如果是对象且不为 null 则返回 true，否则返回 false。
 */
export function isObject(value: unknown): value is Record<any, any> {
  return value !== null && typeof value === 'object';
}

/**
 * 判断值是否为普通对象。
 *
 * @param value - 要校验的值。
 * @returns 如果是普通对象则返回 true，否则返回 false。
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * 判断值是否为空。
 *
 * @param value - 要校验的值。
 * @returns 如果值为空（undefined、null、空字符串、false、0、NaN、空数组或空对象）则返回 true，否则返回 false。
 */
export function isEmpty(value: unknown): value is null | undefined | '' | 0 | boolean | [] | { [key: string]: never } | Record<string, never> {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (typeof value === 'boolean') return !value;
  if (typeof value === 'number') return value === 0 || Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * 判断值是否为非空数据。
 *
 * @param value - 要校验的值。
 * @returns 如果值不为空则返回 true，否则返回 false。
 */
export function isNoEmpty(value: any): boolean {
  return !isEmpty(value);
}

/**
 * 判断值是否为指定构造函数的实例。
 *
 * @param value - 要检查的值。
 * @param base - 构造函数。
 * @returns 如果 value 是 base 的实例则返回 true，否则返回 false。
 */
export function isInstanceOf(value: any, base: any): boolean {
  try {
    return value instanceof base;
  } catch {
    return false;
  }
}
