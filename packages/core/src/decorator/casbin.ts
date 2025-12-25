import { Context } from '@midwayjs/koa';
import { savePropertyDataToClass } from '@midwayjs/core';

export const CASBIN_KEY = 'falcon:decorator:casbin';

export interface CasbinContext extends Context {
  request: Context['request'] & {
    body?: any;
  };
}

export interface CasbinOptions {
  own?: boolean | ((ctx: CasbinContext) => boolean);
  domain?: (ctx: CasbinContext) => any;
  action: string;
  resource: string;
  possession: string;
}

export function Casbin(options: CasbinOptions): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor): void => {
    if (key && descriptor) {
      savePropertyDataToClass(CASBIN_KEY, { key, options }, target, key);
    }
  };
}
