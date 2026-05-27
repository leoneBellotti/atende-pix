import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  it('calculates order total from items', () => {
    const service = new OrdersService({} as never);

    const total = service.calculateTotal([
      { description: 'Servico', quantity: 2, unitPrice: 80, discount: 10 },
      { description: 'Peca', quantity: 1, unitPrice: 50 }
    ]);

    expect(total.toNumber()).toBe(200);
  });
});
