import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAutomationRuleDto } from './dto/create-automation-rule.dto';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';

@Injectable()
export class AutomationsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
