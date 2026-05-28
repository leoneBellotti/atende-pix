import { JsonLoggerService } from './json-logger.service';

describe('JsonLoggerService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes structured application logs', () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = new JsonLoggerService(
      {
        get: vi.fn((key: string, fallback: string) => {
          const values: Record<string, string> = {
            NODE_ENV: 'test'
          };

          return values[key] ?? fallback;
        })
      } as never
    );

    logger.log('application_started', 'Bootstrap');

    expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({
      environment: 'test',
      service: 'atende-pix-api',
      level: 'log',
      context: 'Bootstrap',
      message: 'application_started'
    });
  });

  it('writes structured http logs with metadata', () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = new JsonLoggerService(
      {
        get: vi.fn((key: string, fallback: string) => fallback)
      } as never
    );

    logger.http({
      requestId: 'req-1',
      method: 'GET',
      path: '/health',
      statusCode: 200,
      durationMs: 3
    });

    expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({
      level: 'log',
      context: 'HttpRequest',
      message: 'http_request',
      requestId: 'req-1',
      statusCode: 200
    });
  });
});
