import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type RequestLike = {
  ip?: string;
  path?: string;
  originalUrl?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type RateLimitPolicy = {
  limit: number;
  ttl: number;
};

const ONE_MINUTE_MS = 60_000;

function readNumber(configService: ConfigService, key: string, fallback: number) {
  const value = Number(configService.get<string | number>(key, fallback));

  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
}

export function isRateLimitingEnabled(configService: ConfigService) {
  return configService.get<string>('RATE_LIMIT_ENABLED', 'true') !== 'false';
}

export function getRateLimitPolicy(
  configService: ConfigService,
  request: RequestLike
): RateLimitPolicy {
  const path = request.originalUrl ?? request.path ?? '';
  const defaultTtl = readNumber(configService, 'RATE_LIMIT_TTL_MS', ONE_MINUTE_MS);

  if (path.startsWith('/auth/')) {
    return {
      ttl: readNumber(configService, 'RATE_LIMIT_AUTH_TTL_MS', defaultTtl),
      limit: readNumber(configService, 'RATE_LIMIT_AUTH_MAX', 10)
    };
  }

  if (path.startsWith('/webhooks/')) {
    return {
      ttl: readNumber(configService, 'RATE_LIMIT_WEBHOOK_TTL_MS', defaultTtl),
      limit: readNumber(configService, 'RATE_LIMIT_WEBHOOK_MAX', 60)
    };
  }

  return {
    ttl: defaultTtl,
    limit: readNumber(configService, 'RATE_LIMIT_MAX', 120)
  };
}

export function getRateLimitTracker(configService: ConfigService, request: RequestLike) {
  const trustProxy = configService.get<string>('RATE_LIMIT_TRUST_PROXY', 'false') === 'true';
  const forwardedFor = request.headers?.['x-forwarded-for'];

  if (trustProxy && forwardedFor) {
    const rawValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const [firstAddress] = rawValue.split(',');

    if (firstAddress?.trim()) {
      return firstAddress.trim();
    }
  }

  return request.ip ?? 'unknown';
}

export function getRequestFromContext(context: ExecutionContext): RequestLike {
  return context.switchToHttp().getRequest<RequestLike>();
}
