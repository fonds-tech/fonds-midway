export interface SnowflakeOptions {
  epoch?: number; // 自定义纪元（毫秒），默认 2020-01-01
  datacenterId?: number; // 0..31
  workerId?: number; // 0..31
  sequence?: number; // 0..4095，初始序列
  tolerateSmallBackwards?: boolean; // 容忍小范围回拨（<= 5ms）时用序列补偿
  smallBackwardsThresholdMs?: number; // 小回拨阈值（默认 5ms）
  returnAsString?: boolean; // 返回十进制字符串（默认 true），否则返回 bigint
}

export interface DecomposedId {
  id: bigint;
  timestamp: number; // 绝对时间戳（ms）
  datacenterId: number;
  workerId: number;
  sequence: number;
}

export class Snowflake {
  // 位宽定义
  private static readonly workerIdBits = 5n;
  private static readonly datacenterBits = 5n;
  private static readonly sequenceBits = 12n;

  private static readonly maxWorkerId = (1n << Snowflake.workerIdBits) - 1n; // 31
  private static readonly maxDatacenter = (1n << Snowflake.datacenterBits) - 1n; // 31
  private static readonly sequenceMask = (1n << Snowflake.sequenceBits) - 1n; // 4095

  private static readonly workerIdShift = Snowflake.sequenceBits; // 12
  private static readonly datacenterIdShift = Snowflake.sequenceBits + Snowflake.workerIdBits; // 17
  private static readonly timestampLeftShift = Snowflake.sequenceBits + Snowflake.workerIdBits + Snowflake.datacenterBits; // 22

  private readonly epoch: bigint;
  private readonly datacenterId: bigint;
  private readonly workerId: bigint;

  private lastTimestamp = -1n;
  private sequence: bigint;

  private readonly tolerateSmallBackwards: boolean;
  private readonly smallBackwardsThreshold: bigint;
  private readonly returnAsString: boolean;

  constructor(opts: SnowflakeOptions = {}) {
    const {
      epoch = Date.UTC(2020, 0, 1), // 2020-01-01T00:00:00.000Z
      datacenterId = 0,
      workerId = 0,
      sequence = 0,
      tolerateSmallBackwards = true,
      smallBackwardsThresholdMs = 5,
      returnAsString = true,
    } = opts;

    // 参数校验
    if (datacenterId < 0 || datacenterId > Number(Snowflake.maxDatacenter)) {
      throw new Error(`datacenterId must be 0..${Snowflake.maxDatacenter}`);
    }
    if (workerId < 0 || workerId > Number(Snowflake.maxWorkerId)) {
      throw new Error(`workerId must be 0..${Snowflake.maxWorkerId}`);
    }
    if (sequence < 0 || sequence > Number(Snowflake.sequenceMask)) {
      throw new Error(`sequence must be 0..${Snowflake.sequenceMask}`);
    }

    this.epoch = BigInt(epoch);
    this.datacenterId = BigInt(datacenterId);
    this.workerId = BigInt(workerId);
    this.sequence = BigInt(sequence);

    this.tolerateSmallBackwards = tolerateSmallBackwards;
    this.smallBackwardsThreshold = BigInt(Math.max(0, smallBackwardsThresholdMs));
    this.returnAsString = returnAsString;
  }

  /** 获取当前毫秒时间（bigint） */
  private timeGen(): bigint {
    return BigInt(Date.now());
  }

  /** 自旋到下一个毫秒（同步阻塞版本，适合单次偶发等待） */
  private waitUntilNextMillis(lastTs: bigint): bigint {
    let ts = this.timeGen();
    while (ts <= lastTs) {
      ts = this.timeGen();
    }
    return ts;
  }

  /** 异步等待到下一毫秒（减少 CPU 忙等） */
  private async waitUntilNextMillisAsync(lastTs: bigint): Promise<bigint> {
    let ts = this.timeGen();
    while (ts <= lastTs) {
      // 这里 await 一个微延迟，避免纯忙等；1ms 基本足够
      await new Promise(r => setTimeout(r, 0));
      ts = this.timeGen();
    }
    return ts;
  }

  /** 核心：生成下一个 ID（同步版本） */
  nextId(): string | bigint {
    let timestamp = this.timeGen();

    if (timestamp < this.lastTimestamp) {
      const diff = this.lastTimestamp - timestamp;

      if (this.tolerateSmallBackwards && diff <= this.smallBackwardsThreshold) {
        // 小回拨：借用序列空间
        // 在 lastTimestamp 这一毫秒继续递增序列，直到滚到下一毫秒
        timestamp = this.lastTimestamp;
        this.sequence = (this.sequence + 1n) & Snowflake.sequenceMask;
        if (this.sequence === 0n) {
          // 溢出则推进到下一毫秒
          timestamp = this.waitUntilNextMillis(this.lastTimestamp);
        }
      } else {
        // 大回拨：直接等待
        timestamp = this.waitUntilNextMillis(this.lastTimestamp);
      }
    } else if (timestamp === this.lastTimestamp) {
      // 同毫秒内，自增序列
      this.sequence = (this.sequence + 1n) & Snowflake.sequenceMask;
      if (this.sequence === 0n) {
        // 序列溢出，等待下一毫秒
        timestamp = this.waitUntilNextMillis(this.lastTimestamp);
      }
    } else {
      // 新毫秒，序列从 0 开始（也可随机起点以分散热点）
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    const id =
      ((timestamp - this.epoch) << Snowflake.timestampLeftShift) | (this.datacenterId << Snowflake.datacenterIdShift) | (this.workerId << Snowflake.workerIdShift) | this.sequence;

    return this.returnAsString ? id.toString(10) : id;
  }

  /** 核心：生成下一个 ID（异步版本，减少忙等） */
  async nextIdAsync(): Promise<string | bigint> {
    let timestamp = this.timeGen();

    if (timestamp < this.lastTimestamp) {
      const diff = this.lastTimestamp - timestamp;

      if (this.tolerateSmallBackwards && diff <= this.smallBackwardsThreshold) {
        timestamp = this.lastTimestamp;
        this.sequence = (this.sequence + 1n) & Snowflake.sequenceMask;
        if (this.sequence === 0n) {
          timestamp = await this.waitUntilNextMillisAsync(this.lastTimestamp);
        }
      } else {
        timestamp = await this.waitUntilNextMillisAsync(this.lastTimestamp);
      }
    } else if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & Snowflake.sequenceMask;
      if (this.sequence === 0n) {
        timestamp = await this.waitUntilNextMillisAsync(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    const id =
      ((timestamp - this.epoch) << Snowflake.timestampLeftShift) | (this.datacenterId << Snowflake.datacenterIdShift) | (this.workerId << Snowflake.workerIdShift) | this.sequence;

    return this.returnAsString ? id.toString(10) : id;
  }

  /** 反解一个 ID（无论输入是 string 还是 bigint） */
  decompose(id: string | bigint): DecomposedId {
    const val = typeof id === 'string' ? BigInt(id) : id;

    const sequence = Number(val & Snowflake.sequenceMask);
    const workerId = Number((val >> Snowflake.workerIdShift) & Snowflake.maxWorkerId);
    const datacenterId = Number((val >> Snowflake.datacenterIdShift) & Snowflake.maxDatacenter);
    const timestampPart = val >> Snowflake.timestampLeftShift;
    const timestamp = Number(timestampPart + this.epoch);

    return {
      id: val,
      timestamp,
      datacenterId,
      workerId,
      sequence,
    };
  }
}

export const snowflake = new Snowflake({
  epoch: Date.UTC(2020, 0, 1),
  workerId: Number(process.env.WORKER_ID ?? 0),
  datacenterId: Number(process.env.DATACENTER_ID ?? 0),
  returnAsString: true,
});

/* ========================= 使用示例 =========================
import { Snowflake } from './snowflake';

const sf = new Snowflake({
  epoch: Date.UTC(2020, 0, 1),
  datacenterId: 1,
  workerId: 7,
  returnAsString: true, // 生产环境推荐字符串，避免 JSON 丢精度
});

// 同步生成
const id1 = sf.nextId();         // e.g. "1460647357537236992"
console.log(id1);

// 异步生成（更友好地处理等待）
const main = async () => {
  const id2 = await sf.nextIdAsync();
  console.log(id2);

  const info = sf.decompose(id2);
  console.log('decompose:', info);
};
main();
=========================================================== */

/* ========================= 简易测试 =========================
   （可用 ts-node 运行，或配合 vitest / jest）

import { strict as assert } from 'assert';
const sf = new Snowflake({ datacenterId: 0, workerId: 0, returnAsString: false });

const ids = new Set<bigint>();
for (let i = 0; i < 100000; i++) {
  const id = sf.nextId() as bigint;
  assert(!ids.has(id), 'ID must be unique');
  ids.add(id);
}

// 解析一致性
const anyId = sf.nextId() as bigint;
const { timestamp, datacenterId, workerId, sequence } = sf.decompose(anyId);
assert(datacenterId === 0 && workerId === 0, 'node ids mismatch');
assert(sequence >= 0 && sequence <= 4095, 'sequence out of range');
assert(timestamp >= Date.UTC(2020, 0, 1), 'timestamp before epoch');

console.log('All tests passed.');
=========================================================== */
