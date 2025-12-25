/**
 * 根据字段名从字段列表中获取对应的表别名
 *
 * @param fields - 字段列表，包含表别名和字段名的组合
 * @param field - 要查找的字段名
 * @param defaultAlias - 默认的表别名，当找不到匹配的表别名时返回此值
 * @returns 匹配的表别名或默认别名
 */
export function getTableAliasByField(fields: string[] = [], field: string, defaultAlias = 'a') {
  const patterns = [new RegExp(`(\\w+)\\.(\\w+)\\s+as\\s+${field}\\b`, 'i'), new RegExp(`\\b(\\w+)\\.${field}\\b`, 'i')];

  for (const column of fields) {
    for (const pattern of patterns) {
      const match = column.match(pattern);
      if (match) return match[1];
    }
  }

  return defaultAlias;
}
