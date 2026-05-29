import { QuotesService } from './quotes.service';

describe('QuotesService', () => {
  it('calculates quote totals from items', () => {
    const service = new QuotesService({} as never, {} as never);

    const totals = service.calculateTotals([
      { description: 'Serviço', quantity: 2, unitPrice: 100, discount: 15 },
      { description: 'Peca', quantity: 1, unitPrice: 50 }
    ]);

    expect(totals.subtotal.toNumber()).toBe(250);
    expect(totals.discount.toNumber()).toBe(15);
    expect(totals.total.toNumber()).toBe(235);
  });
});
