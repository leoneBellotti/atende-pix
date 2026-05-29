import { ConfigService } from '@nestjs/config';
import {
  getRateLimitPolicy,
  getRateLimitTracker,
  isRateLimitingEnabled
} from './rate-limiting.config';

function createConfig(values: Record<string, string | number>) {
  return {
    get: vi.fn((key: string, fallback?: string | number) => values[key] ?? fallback)
  } as unknown as ConfigService;
}

describe('rate-limiting config', () => {
  it('uses the global policy for authenticated API routes', () => {
    const config = createConfig({
      RATE_LIMIT_MAX: 200,
      RATE_LIMIT_TTL_MS: 30_000
    });

    expect(getRateLimitPolicy(config, { path: '/customers' })).toEqual({
      limit: 200,
      ttl: 30_000
    });
  });

  it('uses a stricter policy for authentication routes', () => {
    const config = createConfig({
      RATE_LIMIT_MAX: 200,
      RATE_LIMIT_AUTH_MAX: 8,
      RATE_LIMIT_AUTH_TTL_MS: 120_000
    });

    expect(getRateLimitPolicy(config, { path: '/auth/login' })).toEqual({
      limit: 8,
      ttl: 120_000
    });
  });

  it('uses the webhook policy for public webhook routes', () => {
    const config = createConfig({
      RATE_LIMIT_WEBHOOK_MAX: 40
    });

    expect(getRateLimitPolicy(config, { path: '/webhooks/mercado-pago' })).toEqual({
      limit: 40,
      ttl: 60_000
    });
  });

  it('only trusts x-forwarded-for when enabled', () => {
    expect(
      getRateLimitTracker(createConfig({ RATE_LIMIT_TRUST_PROXY: 'false' }), {
        ip: '10.0.0.5',
        headers: {
          'x-forwarded-for': '203.0.113.10, 10.0.0.5'
        }
      })
    ).toBe('10.0.0.5');

    expect(
      getRateLimitTracker(createConfig({ RATE_LIMIT_TRUST_PROXY: 'true' }), {
        ip: '10.0.0.5',
        headers: {
          'x-forwarded-for': '203.0.113.10, 10.0.0.5'
        }
      })
    ).toBe('203.0.113.10');
  });

  it('can be disabled for local troubleshooting', () => {
    expect(isRateLimitingEnabled(createConfig({ RATE_LIMIT_ENABLED: 'false' }))).toBe(false);
    expect(isRateLimitingEnabled(createConfig({}))).toBe(true);
  });
});
