import { BaseError } from './base';
import { ResponseCode, ResponseMessage } from '../enum/response';

/**
 * 自定义错误类，用于处理自定义相关的异常。
 */
export class CustomError extends BaseError {
  constructor(message?: string, code?: number, status?: number) {
    super('CustomError', code ?? ResponseCode.Fail, message ?? ResponseMessage.Fail, status);
  }
}
