import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async summarizeConversation(tenantId: string, conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        tenantId,
        channel: 'WHATSAPP',
        OR: [
          { customerId: conversationId },
          { fromPhone: conversationId },
          { toPhone: conversationId }
        ]
      },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 30
    });

    if (!messages.length) {
      throw new NotFoundException('Conversa nao encontrada para resumo.');
    }

    const customerName =
      messages.find((message) => message.customer?.name)?.customer?.name ??
      messages.find((message) => message.contactName)?.contactName ??
      messages[0].fromPhone ??
      'Contato';
    const inboundMessages = messages.filter((message) => message.direction === 'INBOUND');
    const outboundMessages = messages.filter((message) => message.direction === 'OUTBOUND');
    const lastMessage = messages[messages.length - 1];
    const lastInbound = [...inboundMessages].reverse().find((message) => message.body);

    return {
      conversationId,
      provider: 'LOCAL',
      summary: [
        `Contato: ${customerName}.`,
        `Historico com ${messages.length} mensagens: ${inboundMessages.length} recebidas e ${outboundMessages.length} enviadas.`,
        lastInbound?.body ? `Ultima necessidade informada: ${lastInbound.body}` : null,
        lastMessage?.body ? `Ultima mensagem: ${lastMessage.body}` : null
      ]
        .filter(Boolean)
        .join(' ')
    };
  }

  async suggestReply(tenantId: string, conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        tenantId,
        channel: 'WHATSAPP',
        OR: [
          { customerId: conversationId },
          { fromPhone: conversationId },
          { toPhone: conversationId }
        ]
      },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 30
    });

    if (!messages.length) {
      throw new NotFoundException('Conversa nao encontrada para sugestao.');
    }

    const customerName =
      messages.find((message) => message.customer?.name)?.customer?.name ??
      messages.find((message) => message.contactName)?.contactName ??
      '';
    const lastInbound = [...messages]
      .reverse()
      .find((message) => message.direction === 'INBOUND' && message.body);
    const greeting = customerName ? `Ola, ${customerName}!` : 'Ola!';

    return {
      conversationId,
      provider: 'LOCAL',
      suggestion: [
        greeting,
        lastInbound?.body
          ? 'Recebi sua mensagem e vou verificar os detalhes para te retornar com a melhor opcao.'
          : 'Vou verificar os detalhes e te retorno em seguida.',
        'Se preferir, posso te enviar um orcamento ou link de pagamento por aqui.'
      ].join(' ')
    };
  }
}
