import { BaseError } from './base';
import { ResponseCode, ResponseMessage } from '../enum/response';

/**
 * 参数错误类，用于处理参数相关的异常。
 */
export class ParamError extends BaseError {
  /**
   * 构造参数错误实例。
   *
   * @param message - 错误消息，如果为空则使用默认参数错误消息。
   * @param status - HTTP状态码，可选参数。
   */
  constructor(message: string, status?: number) {
    super('ParamError', ResponseCode.ParamError, message ?? ResponseMessage.ParamError, status);
  }
}

/**
 * 参数缺失错误类，用于处理必需参数缺失的异常。
 */
export class ParamMissingError extends BaseError {
  /**
   * 构造参数缺失错误实例。
   *
   * @param message - 错误消息，如果为空则使用默认参数缺失消息。
   * @param status - HTTP状态码，可选参数。
   */
  constructor(message: string, status?: number) {
    super('ParamMissingError', ResponseCode.ParamMissing, message ?? ResponseMessage.ParamMissing, status);
  }
}

/**
 * 参数无效错误类，用于处理参数格式或值无效的异常。
 */
export class ParamInvalidError extends BaseError {
  /**
   * 构造参数无效错误实例。
   *
   * @param message - 错误消息，如果为空则使用默认参数无效消息。
   * @param status - HTTP状态码，可选参数。
   */
  constructor(message: string, status?: number) {
    super('ParamInvalidError', ResponseCode.ParamInvalid, message ?? ResponseMessage.ParamInvalid, status);
  }
}
