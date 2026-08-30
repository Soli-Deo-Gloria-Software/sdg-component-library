/* @jsxRuntime automatic */
/* @jsxImportSource @stencil/core */

import { describe, it, expect, render, beforeEach, afterEach, vi } from '@stencil/vitest';
import { ReferencePickerState } from '../../utils/enums'

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

  it('Whole book not allowed does not submit for book only', async () => {
    const { root, instance, waitForChanges, spyOnEvent } = await render(<bible-reference-picker allowWholeBookSubmission={false} />);
    const referencesUpdatedSpy = spyOnEvent('referencesUpdated');

    instance!.value = 'Genesis';
    instance!.handleReferenceSubmit('Genesis');
    await waitForChanges();

    expect(referencesUpdatedSpy).not.toHaveReceivedEvent();
    expect(root.querySelectorAll('multiselect-item').length).toBe(0);
  });

  it('Whole book allowed does submits for book only', async () => {
    const { root, instance, waitForChanges, spyOnEvent } = await render(<bible-reference-picker allowWholeBookSubmission={true} />);
    const referencesUpdatedSpy = spyOnEvent('referencesUpdated');

    instance!.value = 'Genesis';
    instance!.handleReferenceSubmit('Genesis');
    await waitForChanges();

    expect(referencesUpdatedSpy).toHaveReceivedEvent();
    expect(referencesUpdatedSpy.lastEvent?.detail).toHaveLength(1);
    expect(referencesUpdatedSpy.lastEvent?.detail[0].toString()).toBe('Genesis');
    expect(root.querySelectorAll('multiselect-item').length).toBeGreaterThan(0);
  });

  it('Whole book not allowed does not submit button when book entered', async () => {
    const { root, waitForChanges } = await render(<bible-reference-picker allowWholeBookSubmission={false} />);
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    dispatchInput(input, 'Genesis');
    await waitForChanges();

    expect(root.querySelectorAll('.icon.circle-check.bg-success.clickable').length).toBe(0);
  });

  it('Whole book allowed renders submit button when book entered', async () => {
    const { root, waitForChanges } = await render(<bible-reference-picker allowWholeBookSubmission={true} />);
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    dispatchInput(input, 'Genesis');
    await waitForChanges();

    expect(root.querySelectorAll('.icon.circle-check.bg-success.clickable').length).toBeGreaterThan(0);
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

  it('Moves to start chapter state when book name is entered', async () => {
    const { root, instance, waitForChanges } = await render(<bible-reference-picker />);
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    dispatchInput(input, 'Genesis ');
    await waitForChanges();

    expect(instance.step).toBe(ReferencePickerState.StartingChapter)
  });

  it('Chapter autocomplete filters available chapters', async () => {
    const { root, instance, waitForChanges } = await render(<bible-reference-picker />);
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    dispatchInput(input, 'Genesis ');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.StartingChapter);

    dispatchInput(input, 'Genesis 1');
    await waitForChanges();

    expect(root.textContent).toContain('Chapter 1');
    expect(root.textContent).toContain('Chapter 10');
    expect(root.textContent).toContain('Chapter 11');
    expect(root.textContent).toContain('Chapter 12');
    expect(root.textContent).toContain('Chapter 13');
    expect(root.textContent).toContain('Chapter 14');
    expect(root.textContent).toContain('Chapter 15');
    expect(root.textContent).toContain('Chapter 16');
    expect(root.textContent).toContain('Chapter 17');
    expect(root.textContent).toContain('Chapter 18');
    expect(root.textContent).toContain('Chapter 19');
    expect(root.textContent).toContain('Chapter 21');
    expect(root.textContent).toContain('Chapter 31');
    expect(root.textContent).toContain('Chapter 41');
  });

  it('Moves to select starting verse state', async () => {
    const { root, instance, waitForChanges } = await render(<bible-reference-picker />);
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    dispatchInput(input, 'Genesis ');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.StartingChapter);

    dispatchInput(input, 'Genesis 1:');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.StartingVerse);

    expect(root.textContent).toContain('Verse 1');
  });

  it('Chapter range moves to end chapter state', async () => {
    const { root, instance, waitForChanges } = await render(<bible-reference-picker />);
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    dispatchInput(input, 'Genesis ');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.StartingChapter);

    dispatchInput(input, 'Genesis 1-');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.EndingChapter);

    expect(root.textContent).not.toContain('Verse');
    expect(root.innerHTML).not.toContain('Chapter 1</li>');
    expect(root.innerHTML).toContain('Chapter 2</li>')
  });

  it('Chapter with verse range moves to end verse state', async () => {
    const { root, instance, waitForChanges } = await render(<bible-reference-picker />);
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    dispatchInput(input, 'Genesis ');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.StartingChapter);

    dispatchInput(input, 'Genesis 1:');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.StartingVerse);

    dispatchInput(input, 'Genesis 1:5-');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.EndingVerse);

    expect(root.textContent).toContain('Select Ending Chapter');
    expect(root.innerHTML).not.toContain('Verse 1</li>');
    expect(root.innerHTML).not.toContain('Verse 2</li>');
    expect(root.innerHTML).not.toContain('Verse 3</li>');
    expect(root.innerHTML).not.toContain('Verse 4</li>');
    expect(root.innerHTML).not.toContain('Verse 5</li>');
    expect(root.innerHTML).toContain('Verse 6</li>')
  });

  it('Range with end chapter loads end verse state', async () => {
    const { root, instance, waitForChanges } = await render(<bible-reference-picker />);
    const input = root.querySelector('input[name="input"]') as HTMLInputElement;

    dispatchInput(input, 'Genesis ');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.StartingChapter);

    dispatchInput(input, 'Genesis 1:');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.StartingVerse);

    dispatchInput(input, 'Genesis 1:5-2:');
    await waitForChanges();
    expect(instance!.step).toBe(ReferencePickerState.EndingVerse);
    expect(root.innerHTML).not.toContain('Verse 1</li>');
  });
});
