import { Prisma } from '@prisma/client';
import { QuotePdfService } from './quote-pdf.service';

describe('QuotePdfService', () => {
  it('generates a pdf buffer for a quote', async () => {
    const service = new QuotePdfService();

    const pdf = await service.generate({
      number: 1,
      status: 'DRAFT',
      subtotal: new Prisma.Decimal(100),
      discount: new Prisma.Decimal(0),
      total: new Prisma.Decimal(100),
      tenant: { name: 'Empresa Teste' },
      customer: { name: 'Cliente Teste' },
      items: [
        {
          description: 'Servico',
          quantity: new Prisma.Decimal(1),
          unitPrice: new Prisma.Decimal(100),
          discount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(100)
        }
      ]
    });

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
