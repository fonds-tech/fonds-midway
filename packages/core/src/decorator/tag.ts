import { tagOptions } from '../interface';
import { savePropertyDataToClass } from '@midwayjs/core';

export const METHOD_TAG_KEY = 'falcon:decorator:method:tag';

export function Tag(tag: tagOptions): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor): void => {
    if (key && descriptor) {
      savePropertyDataToClass(METHOD_TAG_KEY, { key, tag }, target, key);
    }
  };
}
