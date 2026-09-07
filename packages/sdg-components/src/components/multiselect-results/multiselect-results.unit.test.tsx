/* @jsxRuntime automatic */
/* @jsxImportSource @stencil/core */

import { describe, it, expect, render, beforeEach, afterEach, vi } from '@stencil/vitest';

const createMatchMedia = (initialMatches: boolean) => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = initialMatches;
  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: '(max-width: 480px)',
    addEventListener: (_event: 'change', listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_event: 'change', listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchChange: (nextMatches: boolean) => {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      listeners.forEach(listener => listener(event));
    },
  } as MediaQueryList & { dispatchChange: (nextMatches: boolean) => void };

  return mediaQueryList;
};

describe('multiselect-results', () => {
  let matchMediaMock: ReturnType<typeof createMatchMedia>;

  beforeEach(() => {
    matchMediaMock = createMatchMedia(false);
    vi.stubGlobal('matchMedia', () => matchMediaMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing when items is empty', async () => {
    const { root } = await render(<multiselect-results items={[]} />);

    expect(root.innerHTML).toBe('');
  });

  it('renders a count chip and inline items', async () => {
    const items = ['Alpha', 'Beta', 'Gamma'];

    const { root } = await render(
      <multiselect-results items={items} maxInlineItems={2} itemLabel="tag" />,
    );

    const countChip = root.querySelector('.results-count-chip');
    expect(countChip?.textContent?.includes('3 tags')).toBe(true);
    expect(root.querySelectorAll('.results-inline multiselect-item').length).toBe(2);
    expect(root.querySelector('.results-overflow-chip')?.textContent?.includes('+1')).toBe(true);
  });

  it('uses labelKey when provided', async () => {
    const items = [{ name: 'First' }, { name: 'Second' }];

    const { root } = await render(
      <multiselect-results items={items} labelKey="name" itemLabel="item" />,
    );

    const labels = Array.from(root.querySelectorAll('multiselect-item')).map(item =>
      item.textContent?.includes('First') || item.textContent?.includes('Second') ? item.textContent : '',
    );
    expect(labels[0]).toContain('First');
    expect(labels[1]).toContain('Second');
  });

  it('toggles expanded state when count chip is clicked', async () => {
    const items = ['One', 'Two', 'Three'];

    const { root, waitForChanges } = await render(
      <multiselect-results items={items} maxInlineItems={1} itemLabel="item" />,
    );

    const countChip = root.querySelector('.results-count-chip') as HTMLButtonElement;
    expect(countChip.getAttribute('aria-expanded')).toBe('false');

    countChip.click();
    await waitForChanges();

    expect(countChip.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('.results-box')?.classList.contains('expanded')).toBe(true);
  });

  it('emits itemRemoved when a child item remove control is clicked', async () => {
    const items = ['Alpha', 'Beta'];
    const { root, waitForChanges, spyOnEvent } = await render(
      <multiselect-results items={items} itemLabel="item" />,
    );
    const removedSpy = spyOnEvent('itemRemoved');

    const removeControl = root.querySelector('multiselect-item .clickable') as HTMLElement;
    removeControl.click();
    await waitForChanges();

    expect(removedSpy).toHaveReceivedEventTimes(1);
    expect(removedSpy.firstEvent?.detail).toBe('Alpha');
  });

  it('collapses expanded results when clicking outside the component', async () => {
    const items = ['One', 'Two', 'Three'];

    const { instance, waitForChanges } = await render(
      <multiselect-results items={items} maxInlineItems={1} itemLabel="item" />,
    );

    instance!.expanded = true;
    await waitForChanges();

    instance!.handleWindowClick({ composedPath: () => [] } as unknown as MouseEvent);
    await waitForChanges();

    expect(instance!.expanded).toBe(false);
  });

  it('shows all items in the expanded panel when compact layout is active', async () => {
    const items = ['One', 'Two', 'Three'];

    const { root, waitForChanges } = await render(
      <multiselect-results items={items} maxInlineItems={1} itemLabel="item" />,
    );

    matchMediaMock.dispatchChange(true);
    await waitForChanges();

    (root.querySelector('.results-count-chip') as HTMLButtonElement).click();
    await waitForChanges();

    expect(root.querySelectorAll('.results-expanded multiselect-item')).toHaveLength(3);
  });
});
