import { describe, it, expect, vi, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════
// Production browsers only see our errors in the console; servers log everything.
// ═══════════════════════════════════════════════════

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function freshLogger() {
  vi.resetModules();
  return (await import('@/utils/logger')).logger;
}

describe('logger in the browser', () => {
  it('stays quiet in production except for errors', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const spies = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    const logger = await freshLogger();
    logger.debug({ event: 'd' });
    logger.info({ event: 'Razorpay payment capture successful', orderId: 'order_1' });
    logger.warn({ event: 'w' });
    logger.error({ event: 'Razorpay payment failed' });

    expect(spies.debug).not.toHaveBeenCalled();
    expect(spies.info).not.toHaveBeenCalled();
    expect(spies.warn).not.toHaveBeenCalled();
    expect(spies.error).toHaveBeenCalledTimes(1);
  });

  it('logs everything during development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = await freshLogger();
    logger.info({ event: 'visible in dev' });
    expect(info).toHaveBeenCalledTimes(1);
  });
});
