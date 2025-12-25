import type { ILogger } from '@midwayjs/core';
import type { Context } from '@midwayjs/koa';
import { BaseError } from '../error/base';
import { Catch, Logger } from '@midwayjs/core';
import { ResponseCode, ResponseMessage } from '../enum/response';

/**
 * 全局错误处理器，用于统一捕获和处理应用中的错误。
 */
@Catch()
export class GlobalErrorFilter {
  @Logger()
  logger: ILogger;

  /**
   * 捕获并处理异常。
   *
   * @param err - 捕获的异常对象。
   * @returns 标准化的错误响应对象，包含状态码和错误消息。
   */
  async catch(err: BaseError, ctx: Context) {
    this.logger.error(err);

    if (err.status < 600) {
      ctx.response.status = err.status;
    }

    const code = err.status > 599 ? err.status : err.code || ResponseCode.Fail;
    const message = err.message || ResponseMessage.Fail;

    return { code, message };
  }
}
