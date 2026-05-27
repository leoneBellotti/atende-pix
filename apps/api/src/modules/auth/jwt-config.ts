import { ConfigService } from '@nestjs/config';

export function getAccessTokenTtlSeconds(configService: ConfigService) {
  const configuredValue = configService.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS');
  const parsedValue = Number(configuredValue);

  if (!configuredValue || !Number.isFinite(parsedValue) || parsedValue <= 0) {
    return 28800;
  }

  return parsedValue;
}
