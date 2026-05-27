import { describe, expect, it } from 'vitest';
import { customerSchema } from './customer.schema';

describe('customerSchema', () => {
  it('accepts a minimal customer', () => {
    expect(customerSchema.parse({ name: 'Cliente Teste' })).toEqual({ name: 'Cliente Teste' });
  });
});
