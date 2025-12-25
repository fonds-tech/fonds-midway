import { Configuration, IMidwayContainer } from '@midwayjs/core';

@Configuration({
  namespace: 'example',
  importConfigs: [{ default: {} }],
})
export class ExampleConfiguration {
  public async onReady(container: IMidwayContainer) {}
}
