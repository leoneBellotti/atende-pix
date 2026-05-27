import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('creates readable tenant slugs', () => {
    const service = new AuthService({} as never, {} as JwtService);

    expect(service['slugify']('Assistencia Técnica Modelo')).toBe('assistencia-tecnica-modelo');
  });
});
