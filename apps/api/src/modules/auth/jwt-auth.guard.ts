import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    tenantId: string;
  };
};

type AccessTokenPayload = {
  sub: string;
  tenantId: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token ausente.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
      request.user = {
        userId: payload.sub,
        tenantId: payload.tenantId
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token invalido.');
    }
  }

  private extractToken(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
