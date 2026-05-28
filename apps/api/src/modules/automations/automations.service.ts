import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAutomationRuleDto } from './dto/create-automation-rule.dto';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';

@Injectable()
export class AutomationsService {
  constructor(private readonly prisma: PrismaService) {}

  listLogs(tenantId: string) {
    return this.prisma.automationLog.findMany({
      where: { tenantId },
      include: {
        rule: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
  }

  listRules(tenantId: string) {
    return this.prisma.automationRule.findMany({
      where: { tenantId },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  createRule(tenantId: string, input: CreateAutomationRuleDto) {
    return this.prisma.automationRule.create({
      data: {
        tenantId,
        name: input.name,
        trigger: input.trigger,
        delayHours: input.delayHours,
        messageBody: input.messageBody,
        active: input.active ?? false
      }
    });
  }

  async updateRule(tenantId: string, id: string, input: UpdateAutomationRuleDto) {
    const rule = await this.prisma.automationRule.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!rule) {
      throw new NotFoundException('Regra de automacao nao encontrada.');
    }

    return this.prisma.automationRule.update({
      where: { id: rule.id },
      data: {
        name: input.name,
        trigger: input.trigger,
        delayHours: input.delayHours,
        messageBody: input.messageBody,
        active: input.active
      }
    });
  }

  async scheduleExpiringQuoteReminders(tenantId: string) {
    const rules = await this.prisma.automationRule.findMany({
      where: {
        tenantId,
        trigger: 'QUOTE_EXPIRING',
        active: true
      }
    });

    if (!rules.length) {
      return {
        scheduled: 0
      };
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const quotes = await this.prisma.quote.findMany({
      where: {
        tenantId,
        status: 'SENT',
        validUntil: {
          gte: now,
          lte: tomorrow
        }
      },
      include: {
        customer: true
      }
    });

    let scheduled = 0;

    for (const rule of rules) {
      for (const quote of quotes) {
        const scheduledFor = new Date(now.getTime() + rule.delayHours * 60 * 60 * 1000);

        await this.prisma.automationLog.upsert({
          where: {
            tenantId_ruleId_targetType_targetId: {
              tenantId,
              ruleId: rule.id,
              targetType: 'QUOTE',
              targetId: quote.id
            }
          },
          create: {
            tenantId,
            ruleId: rule.id,
            targetType: 'QUOTE',
            targetId: quote.id,
            status: 'SCHEDULED',
            scheduledFor,
            message: this.renderMessage(rule.messageBody, {
              customerName: quote.customer.name,
              quoteNumber: String(quote.number)
            })
          },
          update: {
            status: 'SCHEDULED',
            scheduledFor
          }
        });

        scheduled += 1;
      }
    }

    return {
      scheduled
    };
  }

  async schedulePendingPaymentReminders(tenantId: string) {
    const rules = await this.prisma.automationRule.findMany({
      where: {
        tenantId,
        trigger: 'PAYMENT_PENDING',
        active: true
      }
    });

    if (!rules.length) {
      return {
        scheduled: 0
      };
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        tenantId,
        status: 'PENDING'
      },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    });

    let scheduled = 0;
    const now = new Date();

    for (const rule of rules) {
      for (const payment of payments) {
        const scheduledFor = new Date(now.getTime() + rule.delayHours * 60 * 60 * 1000);

        await this.prisma.automationLog.upsert({
          where: {
            tenantId_ruleId_targetType_targetId: {
              tenantId,
              ruleId: rule.id,
              targetType: 'PAYMENT',
              targetId: payment.id
            }
          },
          create: {
            tenantId,
            ruleId: rule.id,
            targetType: 'PAYMENT',
            targetId: payment.id,
            status: 'SCHEDULED',
            scheduledFor,
            message: this.renderMessage(rule.messageBody, {
              customerName: payment.order.customer.name,
              orderNumber: String(payment.order.number),
              amount: String(payment.amount)
            })
          },
          update: {
            status: 'SCHEDULED',
            scheduledFor
          }
        });

        scheduled += 1;
      }
    }

    return {
      scheduled
    };
  }

  private renderMessage(template: string, values: Record<string, string>) {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, value),
      template
    );
  }
}
