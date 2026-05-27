import { ConfigService } from '@nestjs/config';
import { getAccessTokenTtlSeconds } from './jwt-config';

describe('getAccessTokenTtlSeconds', () => {
  it('parses the string value from environment variables as seconds', () => {
    const configService = {
      get: vi.fn().mockReturnValue('28800')
    };

    expect(getAccessTokenTtlSeconds(configService as unknown as ConfigService)).toBe(28800);
  });

  it('falls back to 8 hours when the value is missing or invalid', () => {
    const configService = {
      get: vi.fn().mockReturnValue('not-a-number')
    };

    expect(getAccessTokenTtlSeconds(configService as unknown as ConfigService)).toBe(28800);
  });
});
