/**
 * CRUD 操作描述枚举
 * 用于定义各种 CRUD 操作的中文描述文本
 */
export enum CrudDescription {
  /** 新增数据操作 */
  create = '新增数据',
  /** 删除数据操作 */
  delete = '删除数据',
  /** 修改数据操作 */
  update = '修改数据',
  /** 分页查询操作 */
  page = '分页查询',
  /** 列表查询操作 */
  list = '列表查询',
  /** 详情查询操作 */
  detail = '详情查询',
}

/**
 * CRUD 操作请求方法枚举
 * 用于定义各种 CRUD 操作对应的 HTTP 请求方法
 */
export enum CrudRequestMethod {
  /** 新增数据使用 POST 方法 */
  create = 'post',
  /** 删除数据使用 POST 方法 */
  delete = 'post',
  /** 修改数据使用 POST 方法 */
  update = 'post',
  /** 分页查询使用 POST 方法 */
  page = 'post',
  /** 列表查询使用 POST 方法 */
  list = 'post',
  /** 详情查询使用 GET 方法 */
  detail = 'get',
}
