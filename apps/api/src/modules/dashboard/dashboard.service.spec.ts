import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('converts nullable decimal aggregate values to numbers', () => {
    const service = new DashboardService({} as never);

    expect(service['decimalToNumber'](null)).toBe(0);
  });
});
