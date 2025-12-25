import type { Application } from '@midwayjs/koa';
import type { ILogger, IMidwayContainer } from '@midwayjs/core';
import * as cache from '@midwayjs/cache-manager';
import * as config from './config/config.default';
import { TagManager } from './manager/tag';
import { Configuration } from '@midwayjs/core';
import { CasbinManager } from './manager/casbin';
import { ModuleManager } from './manager/module';
import { GlobalErrorFilter } from './filter/global';
import { TransactionHandler } from './handler/transaction';
import { ALL, App, Config, ILifeCycle, Logger } from '@midwayjs/core';

@Configuration({
  namespace: 'falcon',
  imports: [cache],
  importConfigs: [{ default: config }],
})
export class FalconConfiguration implements ILifeCycle {
  @App()
  app: Application;

  @Config(ALL)
  config: Record<string, any>;

  @Logger()
  logger: ILogger;

  async onReady(container: IMidwayContainer) {
    this.app.useFilter([GlobalErrorFilter]);

    await container.getAsync(ModuleManager);
    await container.getAsync(TagManager);
    await container.getAsync(CasbinManager);

    if (this.app.getApplicationContext().hasNamespace('typeorm')) {
      await container.getAsync(TransactionHandler);
    }
  }
}
