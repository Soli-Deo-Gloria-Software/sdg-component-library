/* @jsxRuntime automatic */
/* @jsxImportSource @stencil/core */

import { describe, it, expect, render, beforeEach, afterEach, vi } from '@stencil/vitest';

const dispatchInput = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('bible-reference-picker', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an input with placeholder text', async () => {
    const { root } = await render(<bible-reference-picker />);

    const input = root.querySelector('input[name="input"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).toBe('Scripture Reference');
    expect(input.disabled).toBe(false);
  });

  it('opens the book list on focus', async () => {
    const { root, instance, waitForChanges } = await render(<bible-reference-picker />);

    instance!.onFocus();
    await waitForChanges();

    expect(root.querySelector('.result-box.show')).not.toBeNull();
    expect(root.textContent).toContain('Select Book');
    expect(root.textContent).toContain('Genesis');
  });

  it('filters books as the user types', async () => {
    const { root, waitForChanges } = await render(<bible-reference-picker />);
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    dispatchInput(input, 'gen');
    await waitForChanges();

    expect(root.textContent).toContain('Genesis');
    expect(root.textContent).not.toContain('Exodus');
  });

  it('adds a parsed reference and emits referencesUpdated', async () => {
    const { root, instance, waitForChanges, spyOnEvent } = await render(<bible-reference-picker />);
    const referencesUpdatedSpy = spyOnEvent('referencesUpdated');

    instance!.value = 'John 3:16';
    instance!.handleReferenceSubmit('John 3:16');
    await waitForChanges();

    expect(referencesUpdatedSpy).toHaveReceivedEvent();
    expect(referencesUpdatedSpy.lastEvent?.detail).toHaveLength(1);
    expect(referencesUpdatedSpy.lastEvent?.detail[0].toString()).toBe('John 3:16');
    expect(root.querySelectorAll('multiselect-item').length).toBeGreaterThan(0);
  });

  it('disables input after reaching maxNumberOfReferences', async () => {
    const { root, instance, waitForChanges } = await render(
      <bible-reference-picker maxNumberOfReferences={1} />,
    );
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    instance!.handleReferenceSubmit('John 3:16');
    await waitForChanges();

    expect(input.disabled).toBe(true);
  });

  it('removes a selected reference when multiselect-results emits itemRemoved', async () => {
    const { root, instance, waitForChanges, spyOnEvent } = await render(
      <bible-reference-picker maxNumberOfReferences={2} />,
    );
    const referencesUpdatedSpy = spyOnEvent('referencesUpdated');
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    instance!.handleReferenceSubmit('John 3:16');
    await waitForChanges();

    const removeControl = root.querySelector('multiselect-item .clickable') as HTMLElement;
    removeControl.click();
    await waitForChanges();

    expect(referencesUpdatedSpy.lastEvent?.detail).toHaveLength(0);
    expect(root.querySelectorAll('multiselect-item').length).toBe(0);
    expect(input.disabled).toBe(false);
  });

  it('closes the dropdown when clicking outside the component', async () => {
    const { root, instance, waitForChanges } = await render(<bible-reference-picker />);

    instance!.onFocus();
    await waitForChanges();
    expect(root.querySelector('.result-box.show')).not.toBeNull();

    instance!.handleWindowClick({ composedPath: () => [] } as unknown as MouseEvent);
    await waitForChanges();

    expect(instance!.isOpen).toBe(false);
    expect(root.querySelector('.result-box.show')).toBeNull();
  });
});
