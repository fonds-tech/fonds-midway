export enum ResponseCode {
  /** 成功 */
  Success = 0,
  /** 失败 */
  Fail = 1,

  /** 服务器内部错误 */
  CoreError = 1000,

  /** 10000-19999 基础相关 */
  /** 参数错误 */
  ParamError = 10000,
  /** 参数缺失 */
  ParamMissing = 10001,
  /** 参数无效 */
  ParamInvalid = 10002,

  /** 20000-29999 认证相关 */
  /** Authorization错误 */
  AuthorizationError = 20000,
  /** Authorization无效 */
  AuthorizationInvalid = 20001,
  /** Authorization过期 */
  AuthorizationExpired = 20002,
  /** Authorization缺少 */
  AuthorizationMissing = 20003,
}

export enum ResponseMessage {
  /** 成功 */
  Success = '请求成功',
  /** 请求失败 */
  Fail = '请求失败',

  /** 服务器内部错误 */
  CoreError = '服务器内部错误',

  /** 未找到实体 */
  NotFoundEntity = '未找到实体',

  /** 参数错误 */
  ParamError = '参数错误',
  /** 参数缺失 */
  ParamMissing = '参数缺失',
  /** 参数无效 */
  ParamInvalid = '参数无效',

  /** 认证错误 */
  AuthorizationError = 'Authorization错误',
  /** Authorization无效 */
  AuthorizationInvalid = 'Authorization无效',
  /** Authorization过期 */
  AuthorizationExpired = 'Authorization过期',
  /** Authorization缺少 */
  AuthorizationMissing = 'Authorization缺少',

  /** id 参数不能为空 */
  NoId = 'id 参数不能为空',
  /** 数据未找到 */
  NotFound = '数据未找到',
  /** 排序参数错误 */
  SortParamError = '排序参数错误',
}
