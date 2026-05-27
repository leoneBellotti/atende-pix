import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

type HealthResponse = {
  status: 'ok';
  service: 'atende-pix-api';
  timestamp: string;
};

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'API is healthy' })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'atende-pix-api',
      timestamp: new Date().toISOString()
    };
  }
}
