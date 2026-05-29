import { expect, test } from '@playwright/test';

type AuthResponse = {
  accessToken: string;
  tenant: {
    id: string;
  };
};

test('cliente, catalogo, orcamento, pedido, pagamento e dashboard', async ({ request }) => {
  const unique = Date.now();
  const password = 'senha-e2e-123';

  const registerResponse = await request.post('/auth/register', {
    data: {
      tenantName: `Empresa E2E ${unique}`,
      tenantPhone: '11999990000',
      userName: 'Usuario E2E',
      email: `e2e-${unique}@atendepix.local`,
      password
    }
  });
  expect(registerResponse.ok()).toBeTruthy();

  const auth = (await registerResponse.json()) as AuthResponse;
  const headers = {
    Authorization: `Bearer ${auth.accessToken}`
  };

  const customerResponse = await request.post('/customers', {
    headers,
    data: {
      name: 'Cliente Fluxo Principal',
      phone: `119${String(unique).slice(-8)}`,
      email: `cliente-${unique}@example.com`
    }
  });
  expect(customerResponse.ok()).toBeTruthy();
  const customer = await customerResponse.json();

  const catalogResponse = await request.post('/catalog/items', {
    headers,
    data: {
      type: 'SERVICE',
      name: `Servico E2E ${unique}`,
      description: 'Servico usado no teste ponta a ponta',
      price: 150
    }
  });
  expect(catalogResponse.ok()).toBeTruthy();
  const catalogItem = await catalogResponse.json();

  const quoteResponse = await request.post('/quotes', {
    headers,
    data: {
      customerId: customer.id,
      items: [
        {
          catalogItemId: catalogItem.id,
          description: catalogItem.name,
          quantity: 2,
          unitPrice: 150,
          discount: 20
        }
      ]
    }
  });
  expect(quoteResponse.ok()).toBeTruthy();
  const quote = await quoteResponse.json();
  expect(Number(quote.total)).toBe(280);

  const publicQuoteResponse = await request.get(`/public/quotes/${quote.publicToken}`);
  expect(publicQuoteResponse.ok()).toBeTruthy();
  expect(publicQuoteResponse.headers()['content-type']).toContain('application/json');
  const publicQuote = await publicQuoteResponse.json();
  expect(publicQuote.id).toBe(quote.id);

  const orderResponse = await request.post(`/orders/from-quote/${quote.id}`, {
    headers
  });
  expect(orderResponse.ok()).toBeTruthy();
  const order = await orderResponse.json();
  expect(order.status).toBe('WAITING_PAYMENT');
  expect(Number(order.total)).toBe(280);

  const paymentResponse = await request.post(`/orders/${order.id}/payments/manual-confirm`, {
    headers,
    data: {
      amount: 280
    }
  });
  expect(paymentResponse.ok()).toBeTruthy();
  const payment = await paymentResponse.json();
  expect(payment.status).toBe('PAID');

  const orderDetailResponse = await request.get(`/orders/${order.id}`, {
    headers
  });
  expect(orderDetailResponse.ok()).toBeTruthy();
  const paidOrder = await orderDetailResponse.json();
  expect(paidOrder.status).toBe('PAID');

  const dashboardResponse = await request.get('/dashboard/summary', {
    headers
  });
  expect(dashboardResponse.ok()).toBeTruthy();
  const dashboard = await dashboardResponse.json();
  expect(dashboard.revenueThisMonth).toBe(280);
  expect(dashboard.ordersByStatus).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        status: 'PAID',
        count: 1
      })
    ])
  );
});
