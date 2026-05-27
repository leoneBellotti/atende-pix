import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdatePaymentProviderConfigDto } from './dto/update-payment-provider-config.dto';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: this.tenantSelect()
    });

    if (!tenant) {
      throw new NotFoundException('Empresa nao encontrada.');
    }

    return tenant;
  }

  updateTenantSettings(tenantId: string, input: UpdateTenantSettingsDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: input.name,
        document: this.nullable(input.document),
        phone: this.nullable(input.phone),
        logoUrl: this.nullable(input.logoUrl)
      },
      select: this.tenantSelect()
    });
  }

  async getPaymentProviderConfig(tenantId: string, provider = PaymentProvider.MERCADO_PAGO) {
    const config = await this.prisma.paymentProviderConfig.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider
        }
      }
    });

    if (!config) {
      return {
        provider,
        active: false,
        sandbox: true,
        hasAccessToken: false,
        hasPublicKey: false,
        hasWebhookSecret: false
      };
    }

    return this.toProviderConfigResponse(config);
  }

  async updatePaymentProviderConfig(tenantId: string, input: UpdatePaymentProviderConfigDto) {
    const provider = input.provider ?? PaymentProvider.MERCADO_PAGO;

    const config = await this.prisma.paymentProviderConfig.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider
        }
      },
      create: {
        tenantId,
        provider,
        active: input.active ?? false,
        sandbox: input.sandbox ?? true,
        accessToken: this.nullable(input.accessToken),
        publicKey: this.nullable(input.publicKey),
        webhookSecret: this.nullable(input.webhookSecret)
      },
      update: {
        active: input.active,
        sandbox: input.sandbox,
        accessToken: this.nullable(input.accessToken),
        publicKey: this.nullable(input.publicKey),
        webhookSecret: this.nullable(input.webhookSecret)
      }
    });

    return this.toProviderConfigResponse(config);
  }

  private nullable(value?: string) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  private tenantSelect() {
    return {
      id: true,
      name: true,
      slug: true,
      document: true,
      phone: true,
      logoUrl: true,
      updatedAt: true
    };
  }

  private toProviderConfigResponse(config: {
    provider: PaymentProvider;
    active: boolean;
    sandbox: boolean;
    accessToken: string | null;
    publicKey: string | null;
    webhookSecret: string | null;
    updatedAt?: Date;
  }) {
    return {
      provider: config.provider,
      active: config.active,
      sandbox: config.sandbox,
      hasAccessToken: Boolean(config.accessToken),
      hasPublicKey: Boolean(config.publicKey),
      hasWebhookSecret: Boolean(config.webhookSecret),
      updatedAt: config.updatedAt
    };
  }
}
