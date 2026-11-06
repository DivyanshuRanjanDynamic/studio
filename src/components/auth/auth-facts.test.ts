import { describe, expect, it } from 'vitest';
import { quoteShowcase } from '@/lib/services/service-facts';
import { EXAMPLE_QUOTE } from './auth-facts';

describe('auth facts', () => {
  it('example quote matches the pricing engine', () => {
    const live = quoteShowcase();
    expect(EXAMPLE_QUOTE.part).toBe(live.part);
    expect(EXAMPLE_QUOTE.material).toBe(live.material);
    expect(EXAMPLE_QUOTE.process).toBe(live.process);
    expect(EXAMPLE_QUOTE.leadTimeDays).toBe(live.leadTimeDays);
    expect(EXAMPLE_QUOTE.prices.map((p) => [p.quantity, p.label])).toEqual(live.prices.map((p) => [p.quantity, p.label]));
  });
});
