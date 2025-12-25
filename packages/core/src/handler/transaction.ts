import { FailError } from '../error/fail';
import type { Application } from '@midwayjs/koa';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { TRANSACTION_KEY, TransactionOptions } from '../decorator/transaction';
import { App, Init, Inject, JoinPoint, MidwayDecoratorService, Provide, Scope, ScopeEnum } from '@midwayjs/core';

/**
 * 事务处理
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class TransactionHandler {
  @App()
  app: Application;

  @Inject()
  decoratorService: MidwayDecoratorService;

  typeORMDataSourceManager: TypeORMDataSourceManager;

  @Init()
  async init() {
    if (this.app.getApplicationContext().hasNamespace('typeorm')) {
      this.typeORMDataSourceManager = await this.app.getApplicationContext().getAsync(TypeORMDataSourceManager);
    }

    await this.transaction();
  }

  async transaction() {
    this.decoratorService.registerMethodHandler(TRANSACTION_KEY, options => {
      return {
        around: async (joinPoint: JoinPoint) => {
          const option: TransactionOptions = options.metadata;
          const dataSource = this.typeORMDataSourceManager.getDataSource(option?.name || 'default');
          const queryRunner = dataSource.createQueryRunner();
          await queryRunner.connect();
          if (option && option.isolation) {
            await queryRunner.startTransaction(option.isolation);
          } else {
            await queryRunner.startTransaction();
          }
          let data: any;
          try {
            joinPoint.args.push(queryRunner);
            data = await joinPoint.proceed(...joinPoint.args);
            await queryRunner.commitTransaction();
          } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new FailError(error.message);
          } finally {
            await queryRunner.release();
          }
          return data;
        },
      };
    });
  }
}
