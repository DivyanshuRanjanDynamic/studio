import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { InstantQuoteStep } from './InstantQuoteStep';
import { ErrorCode } from '@/utils/errors';

// ═══════════════════════════════════════════════════
// InstantQuoteStep — what the customer sees when sheet analysis fails
// ═══════════════════════════════════════════════════

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

function render(props: Partial<ComponentProps<typeof InstantQuoteStep>>) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <InstantQuoteStep
        kind="sheet"
        analysisStatus="error"
        analysisError={null}
        onRetryAnalysis={() => {}}
        quote={null}
        unavailableReason={null}
        unpricedProcesses={[]}
        quantity={1}
        partName="Rail"
        {...props}
      />
    )
  );
  return host;
}

const button = (el: HTMLElement, label: RegExp) =>
  Array.from(el.querySelectorAll('button')).find((b) => label.test(b.textContent ?? ''));

describe('InstantQuoteStep — sheet analysis errors', () => {
  it('explains a part that is not sheet metal and offers CNC instead of a retry', () => {
    const onSwitchToCnc = vi.fn();
    const el = render({
      analysisError: "No constant sheet thickness found — this part doesn't look like sheet metal.",
      analysisErrorCode: ErrorCode.NOT_SHEET_METAL,
      onSwitchToCnc,
    });

    expect(el.textContent).toContain('Not a sheet-metal part');
    expect(el.textContent).toContain("doesn't look like sheet metal");
    expect(button(el, /retry/i)).toBeUndefined();

    act(() => button(el, /CNC machining/i)!.click());
    expect(onSwitchToCnc).toHaveBeenCalledOnce();
  });

  it('keeps the retry for other failures', () => {
    const el = render({
      analysisError: 'The CAD analysis service is unavailable. Please try again shortly.',
      analysisErrorCode: ErrorCode.SERVICE_UNAVAILABLE,
      onSwitchToCnc: () => {},
    });
    expect(button(el, /retry/i)).toBeDefined();
    expect(button(el, /CNC machining/i)).toBeUndefined();
  });
});
