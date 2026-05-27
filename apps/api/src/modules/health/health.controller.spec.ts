import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns the api health status', () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toMatchObject({
      status: 'ok',
      service: 'atende-pix-api'
    });
  });
});
