import { BaseError } from './base';
import { ResponseCode, ResponseMessage } from '../enum/response';

/**
 * 失败错误类，用于处理失败相关的异常。
 */
export class FailError extends BaseError {
  constructor(message: string, status?: number) {
    super('FailError', ResponseCode.Fail, message ? message : ResponseMessage.Fail, status);
  }
}
