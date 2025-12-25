# @midwayjs/example

Midway Example 组件示例

## 安装

```bash
npm i @midwayjs/example
```

## 配置

config.{env}.ts

```ts
config.example = {
  // 在这里配置组件选项
};
```

## 使用

```ts
import { Configuration } from '@midwayjs/example';

// 在 configuration.ts 中引入
@Configuration({
  imports: [example],
})
export class ContainerLifeCycle {}
```
