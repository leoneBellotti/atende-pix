import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ErrorMonitoringService } from './error-monitoring.service';

describe('ErrorMonitoringService', () => {
  it('writes 5xx errors as JSON lines', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'atende-pix-errors-'));
    const logPath = join(tempDir, 'api-errors.log');
    const service = new ErrorMonitoringService(
      {
        get: vi.fn((key: string, fallback: string) => {
          const values: Record<string, string> = {
            ERROR_LOG_PATH: logPath,
            NODE_ENV: 'test'
          };

          return values[key] ?? fallback;
        })
      } as never
    );

    await service.captureError({
      statusCode: 500,
      method: 'GET',
      path: '/health',
      message: 'boom'
    });

    const [line] = (await readFile(logPath, 'utf8')).trim().split('\n');
    expect(JSON.parse(line)).toMatchObject({
      environment: 'test',
      statusCode: 500,
      method: 'GET',
      path: '/health',
      message: 'boom'
    });

    await rm(tempDir, { recursive: true, force: true });
  });

  it('ignores 4xx errors by default', async () => {
    const service = new ErrorMonitoringService(
      {
        get: vi.fn((key: string, fallback: string) => {
          const values: Record<string, string> = {
            ERROR_MONITORING_ENABLED: 'true'
          };

          return values[key] ?? fallback;
        })
      } as never
    );

    await expect(
      service.captureError({
        statusCode: 404,
        message: 'not found'
      })
    ).resolves.toBeUndefined();
  });
});
