import { BaseError } from './base';
import { ResponseCode, ResponseMessage } from '../enum/response';

/**
 * 认证错误类，用于处理认证相关的异常。
 */
export class AuthError extends BaseError {
  constructor(message: string, status?: number) {
    super('AuthError', ResponseCode.AuthorizationError, message ?? ResponseMessage.AuthorizationError, status);
  }
}
