import { BaseError } from './base';
import { ResponseCode, ResponseMessage } from '../enum/response';

/**
 * 服务器内部错误类，用于处理服务器内部相关的异常。
 */
export class CoreError extends BaseError {
  constructor(message: string, status?: number) {
    super('CoreError', ResponseCode.CoreError, message ?? ResponseMessage.CoreError, status);
  }
}
