import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { defaultPlans } from '../billing/billing.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(input: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const slug = await this.createAvailableSlug(input.tenantName);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const demoPlanDefaults = defaultPlans.find((plan) => plan.code === 'demo');
        if (!demoPlanDefaults) {
          throw new Error('Plano demo nao configurado.');
        }

        const demoPlan = await tx.subscriptionPlan.upsert({
          where: { code: demoPlanDefaults.code },
          create: demoPlanDefaults,
          update: demoPlanDefaults
        });

        const tenant = await tx.tenant.create({
          data: {
            name: input.tenantName,
            slug,
            phone: input.tenantPhone,
            aiMonthlyLimit: demoPlan.aiMonthlyLimit
          }
        });

        const user = await tx.user.create({
          data: {
            name: input.userName,
            email: input.email.toLowerCase(),
            passwordHash
          }
        });

        await tx.membership.create({
          data: {
            tenantId: tenant.id,
            userId: user.id,
            role: 'OWNER'
          }
        });

        const now = new Date();
        const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: demoPlan.id,
            status: 'TRIAL',
            currentPeriodStart: now,
            currentPeriodEnd: trialEndsAt,
            renewsAt: trialEndsAt
          }
        });

        return { tenant, user };
      });

      return this.toAuthResponse(result.user, result.tenant);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('E-mail ou empresa ja cadastrado.');
      }

      throw error;
    }
  }

  async login(input: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            tenant: true
          },
          take: 1
        }
      }
    });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha invalidos.');
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('Usuario sem empresa vinculada.');
    }

    return this.toAuthResponse(user, membership.tenant);
  }

  private async toAuthResponse(
    user: { id: string; name: string; email: string },
    tenant: { id: string; name: string; slug: string }
  ): Promise<AuthResponse> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      tenantId: tenant.id
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      }
    };
  }

  private async createAvailableSlug(name: string): Promise<string> {
    const baseSlug = this.slugify(name);
    let slug = baseSlug;
    let suffix = 2;

    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private slugify(value: string): string {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return normalized || 'empresa';
  }
}
