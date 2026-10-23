import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  buildCalibrationReport,
  NO_CALIBRATION,
  type CalibrationChange,
  type CalibrationSample,
} from '@/lib/quoting/pricing-calibration';

// ═══════════════════════════════════════════════════
// Admin Pricing Calibration panel — report, Apply / Undo with confirmation, change log
// ═══════════════════════════════════════════════════

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const getIdToken = vi.fn(async () => 'id-token');
// The real hook returns the same user object across renders
const signedIn = { user: { getIdToken }, isUserLoading: false };
vi.mock('@/firebase', () => ({ useUser: () => signedIn }));
const toast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));

const fetchMock = vi.fn();
let root: Root | null = null;
let host: HTMLDivElement | null = null;

beforeEach(() => {
  fetchMock.mockReset();
  toast.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  document.body.innerHTML = '';
  root = null;
  host = null;
  vi.unstubAllGlobals();
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const NOW = Date.parse('2026-10-23T10:00:00Z');
const s = (overrides: Partial<CalibrationSample>): CalibrationSample => ({
  service: 'sheet',
  materialId: 'ms-crca',
  quantity: 10,
  instantPricePerPart: 100,
  agreedPricePerPart: 120,
  multiplierAtPricing: 1,
  ...overrides,
});
const ctx = { config: NO_CALIBRATION, changes: [] as CalibrationChange[], now: NOW };

const settle = async (el: HTMLElement) => {
  // Wait for requests to settle (slower when the whole suite runs in parallel)
  for (let i = 0; i < 100 && el.querySelector('.animate-spin'); i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
  }
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
};

async function render() {
  const { PricingCalibration } = await import('./PricingCalibration');
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(<PricingCalibration />);
  });
  await settle(host);
  return host;
}

const button = (label: RegExp) =>
  Array.from(document.querySelectorAll('button')).find((b) => label.test(b.textContent ?? '')) as HTMLButtonElement | undefined;

// The first test pays for importing the panel's UI dependencies
describe('PricingCalibration', { timeout: 20_000 }, () => {
  it('loads the report with the admin token and shows each service with its verdict', async () => {
    const report = buildCalibrationReport(
      [
        ...[110, 118, 120, 122, 130].map((a) => s({ agreedPricePerPart: a })),
        s({ service: 'cnc', materialId: 'al_6061', quantity: 1, agreedPricePerPart: 90 }),
      ],
      ctx
    );
    fetchMock.mockResolvedValue(json(200, report));
    const el = await render();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/admin/pricing-calibration');
    expect(init.headers.Authorization).toBe('Bearer id-token');

    const text = el.textContent ?? '';
    expect(text).toContain('6 engineer-priced parts');
    expect(text).toContain('1 service to adjust');
    expect(text).toContain('Sheet metal (laser)');
    expect(text).toContain('+20% vs instant');
    expect(text).toContain('Adjust');
    expect(text).toContain('Applying needs 10 engineer-priced parts (5 so far)');
    expect(text).toContain('Not enough data');
    expect(text).toContain('Needs 4 more engineer-priced parts');
    expect(text).toContain('none — default rates');
    expect(button(/^Apply/)).toBeUndefined();
  });

  it('applies a correction only after confirming, then reloads', async () => {
    const before = buildCalibrationReport(Array.from({ length: 12 }, () => s({ agreedPricePerPart: 125 })), ctx);
    const appliedChange: CalibrationChange = {
      id: 'log_1', key: 'sheet', action: 'apply', from: 1, to: 1.15, previous: null, next: 1.15,
      samples: 12, targetMultiplier: 1.25, appliedBy: 'admin@mechhub.in', appliedAt: new Date(NOW).toISOString(),
    };
    const after = buildCalibrationReport(Array.from({ length: 12 }, () => s({ agreedPricePerPart: 125 })), {
      config: { multipliers: { sheet: 1.15 } },
      changes: [appliedChange],
      now: NOW,
    });
    fetchMock
      .mockResolvedValueOnce(json(200, before))
      .mockResolvedValueOnce(json(200, { change: appliedChange }))
      .mockResolvedValueOnce(json(200, after));
    const el = await render();

    await act(async () => button(/^Apply ×1\.15/)!.click());
    // Nothing changes until the admin confirms
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain('Change Sheet metal (laser) prices?');
    expect(document.body.textContent).toContain('capped at ±15%');

    const confirm = Array.from(document.querySelectorAll('[role="alertdialog"] button')).find((b) =>
      /Apply ×1\.15/.test(b.textContent ?? '')
    ) as HTMLButtonElement;
    await act(async () => confirm.click());
    await settle(el);

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('/api/v1/admin/pricing-calibration/apply');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ key: 'sheet' });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Correction applied' }));

    // Reloaded: the correction is active, logged, and can be undone (but not re-applied during the cooldown)
    const text = el.textContent ?? '';
    expect(text).toContain('Sheet metal (laser) ×1.15');
    expect(text).toContain('Applied');
    expect(text).toContain('admin@mechhub.in');
    expect(text).toMatch(/Changed recently/);
    expect(button(/Undo last change/)).toBeDefined();
  });

  it('shows the refusal when the server blocks a change', async () => {
    const report = buildCalibrationReport(Array.from({ length: 12 }, () => s({ agreedPricePerPart: 125 })), ctx);
    fetchMock
      .mockResolvedValueOnce(json(200, report))
      .mockResolvedValueOnce(json(409, { error: 'Pricing calibration changed while you were looking. Refresh and try again.' }));
    await render();

    await act(async () => button(/^Apply/)!.click());
    const confirm = Array.from(document.querySelectorAll('[role="alertdialog"] button')).find((b) =>
      /Apply/.test(b.textContent ?? '')
    ) as HTMLButtonElement;
    await act(async () => confirm.click());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Correction not applied', variant: 'destructive', description: expect.stringMatching(/Refresh/) })
    );
  });

  it('sets the shop load after confirming, showing the surge it causes', async () => {
    const report = buildCalibrationReport([s({})], ctx);
    fetchMock
      .mockResolvedValueOnce(json(200, report))
      .mockResolvedValueOnce(json(200, { change: { key: 'shop_load', action: 'shop_load', from: 0.65, to: 0.9 } }))
      .mockResolvedValueOnce(json(200, { ...report, shopLoad: 0.9 }));
    const el = await render();

    expect(el.textContent).toContain('Now: 65%');
    expect(el.textContent).toContain('(default — not set yet)');
    expect(el.textContent).toContain('No rush surge');

    const input = el.querySelector('#shop-load') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, '90');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(el.textContent).toContain('At 90%: +10% on Rush & Same-day');

    await act(async () => button(/Save shop load/)!.click());
    expect(fetchMock).toHaveBeenCalledTimes(1); // not until confirmed
    const confirm = Array.from(document.querySelectorAll('[role="alertdialog"] button')).find((b) =>
      /Set 90%/.test(b.textContent ?? '')
    ) as HTMLButtonElement;
    await act(async () => confirm.click());
    await settle(el);

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('/api/v1/admin/pricing-calibration/shop-load');
    expect(JSON.parse(init.body)).toEqual({ percent: 90 });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Shop load saved' }));
    expect(el.textContent).toContain('Now: 90%');
  });

  it('names materials and batch sizes in their tabs', async () => {
    const report = buildCalibrationReport([s({}), s({ service: 'cnc', materialId: 'al_6061', quantity: 100 })], ctx);
    fetchMock.mockResolvedValue(json(200, report));
    const el = await render();

    const tab = (label: string) =>
      Array.from(el.querySelectorAll('[role="tab"]')).find((t) => t.textContent === label) as HTMLElement;
    await act(async () => {
      tab('By material').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
      tab('By material').click();
    });
    expect(el.textContent).toContain('CRCA Mild Steel');
    expect(el.textContent).toContain('Aluminium 6061-T6');
  });

  it('explains how samples accrue when nothing is priced yet', async () => {
    fetchMock.mockResolvedValue(json(200, buildCalibrationReport([], ctx)));
    const el = await render();
    expect(el.textContent).toContain('No engineer-priced parts yet');
    expect(el.textContent).toContain('No corrections applied yet');
  });

  it('shows the API error instead of an empty report', async () => {
    fetchMock.mockResolvedValue(json(403, { error: 'Access denied. Allowed roles: admin' }));
    const el = await render();
    expect(el.textContent).toContain('Access denied');
  });
});

describe('labels', () => {
  it('formats group keys and gaps', async () => {
    const { groupLabel, groupTitle, gapLabel } = await import('./PricingCalibration');
    expect(groupLabel('sheet', 'service')).toEqual(['Sheet metal (laser)', null]);
    expect(groupLabel('cnc · ss_304', 'material')).toEqual(['CNC machining', 'Stainless Steel 304']);
    expect(groupLabel('print · 50+ pcs', 'quantity')).toEqual(['3D printing', '50+ pcs']);
    expect(groupLabel('print · petg', 'material')).toEqual(['3D printing', 'PETG']);
    expect(groupTitle('sheet · ms-crca')).toBe('CRCA Mild Steel · Sheet metal (laser)');
    expect(groupTitle('cnc')).toBe('CNC machining');
    expect(gapLabel(1.2)).toBe('+20% vs instant');
    expect(gapLabel(0.92)).toBe('−8% vs instant');
    expect(gapLabel(1.001)).toBe('matches instant');
  });
});
