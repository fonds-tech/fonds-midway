import { transformerTime } from '../util/transformer';
import { Index, UpdateDateColumn, CreateDateColumn, DeleteDateColumn, PrimaryColumn, BaseEntity as TypeORMBaseEntity } from 'typeorm';

/**
 * 基础实体类，提供通用的实体字段和功能。
 */
export abstract class BaseEntity extends TypeORMBaseEntity {
  /**
   * 主键ID
   */
  @PrimaryColumn({ type: 'bigint', comment: 'ID' })
  id: string;

  /**
   * 创建时间，记录数据的创建时间。
   */
  @Index()
  @CreateDateColumn({ comment: '创建时间', transformer: transformerTime })
  createTime: Date;

  /**
   * 更新时间，记录数据的最后更新时间。
   */
  @Index()
  @UpdateDateColumn({ comment: '更新时间', transformer: transformerTime })
  updateTime: Date;

  /**
   * 删除时间，记录数据的删除时间。
   */
  @DeleteDateColumn({ comment: '删除时间', transformer: transformerTime })
  deletedTime?: Date;
}
