import { Configuration } from '@midwayjs/core';

@Configuration({
  imports: [require('../../../../src')],
  importConfigs: [
    {
      default: {
        example: {
          // 在这里配置 example 组件
        },
      },
    },
  ],
})
export class AutoConfiguration {}
