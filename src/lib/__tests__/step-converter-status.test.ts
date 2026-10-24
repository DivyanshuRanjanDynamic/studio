import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════
// convertStepFile: the converter only shows a job to the user who created it, so
// every /status poll carries that user's convert ticket, renewed if it expires.
// ═══════════════════════════════════════════════════

type Call = { url: string; auth: string | null };
let calls: Call[];
let tickets: string[];
let statusReplies: Array<{ status: number; body?: unknown }>;

beforeEach(() => {
  vi.useFakeTimers();
  calls = [];
  tickets = ['ticket_1', 'ticket_2'];
  statusReplies = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization');
      calls.push({ url, auth });
      if (url === '/api/v1/cad/convert-ticket') {
        return new Response(JSON.stringify({ ticket: tickets.shift() }), { status: 200 });
      }
      if (url.endsWith('/convert')) {
        return new Response(JSON.stringify({ jobId: 'job_1', status: 'queued' }), { status: 202 });
      }
      const reply = statusReplies.shift() ?? { status: 200, body: { status: 'processing' } };
      return new Response(JSON.stringify(reply.body ?? {}), { status: reply.status });
    })
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('convertStepFile status polling', () => {
  it("sends the user's ticket, and renews it when the converter says it expired", async () => {
    statusReplies = [
      { status: 200, body: { status: 'processing' } },
      { status: 401 }, // ticket expired mid-conversion
      { status: 200, body: { status: 'done', result: { stl: 'AAAA' } } },
    ];
    const { convertStepFile } = await import('@/services/stepConverter.service');
    const file = new File([new Uint8Array([1, 2, 3])], 'part.step');

    const done = convertStepFile(file);
    await vi.runAllTimersAsync();
    expect(await done).toEqual({ stl: 'AAAA' });

    const polls = calls.filter((c) => c.url.includes('/status/job_1'));
    expect(polls.map((c) => c.auth)).toEqual(['Bearer ticket_1', 'Bearer ticket_1', 'Bearer ticket_2']);
    expect(calls.filter((c) => c.url === '/api/v1/cad/convert-ticket')).toHaveLength(2);
  });
});
