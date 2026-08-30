/* @jsxRuntime automatic */
/* @jsxImportSource @stencil/core */

import { describe, it, expect, render } from '@stencil/vitest';

describe('multiselect-item', () => {
  it('renders slotted content with a remove control', async () => {
    const { root } = await render(
      <multiselect-item itemReference="ref-1">
        Genesis 1:1
      </multiselect-item>,
    );

    expect(root).toHaveLightTextContent('Genesis 1:1');
    expect(root.querySelector('.clickable')).not.toBeNull();
  });

  it('emits removeItem with itemReference when remove control is clicked', async () => {
    const itemReference = { id: 42, label: 'Genesis 1:1' };
    const { root, waitForChanges, spyOnEvent } = await render(
      <multiselect-item itemReference={itemReference}>
        Genesis 1:1
      </multiselect-item>,
    );
    const removeSpy = spyOnEvent('removeItem');

    const removeControl = root.querySelector('.clickable') as HTMLElement;
    removeControl.click();
    await waitForChanges();

    expect(removeSpy).toHaveReceivedEventTimes(1);
    expect(removeSpy.firstEvent?.detail).toEqual(itemReference);
  });
});
