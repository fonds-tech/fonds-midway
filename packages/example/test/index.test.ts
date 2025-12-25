import { close, createLightApp } from '@midwayjs/mock';
import { join } from 'path';

describe('/test/index.test.ts', () => {
  it('should test example component', async () => {
    const app = await createLightApp(join(__dirname, './fixtures/base-app'));

    // 在这里添加你的测试逻辑
    expect(app).toBeDefined();

    await close(app);
  });
});
