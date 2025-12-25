/**
 * 基础错误类，提供统一的异常处理机制。
 */
export class BaseError extends Error {
  /** 状态码 */
  code: number;
  /** HTTP状态码 */
  status: number;

  /**
   * 构造基础异常实例。
   *
   * @param name - 异常名称。
   * @param code - 错误代码。
   * @param message - 异常消息。
   * @param status - HTTP状态码。
   */
  constructor(name: string, code: number, message: string, status: number) {
    super(message);

    this.name = name;
    this.code = code;
    this.status = status;
  }
}
