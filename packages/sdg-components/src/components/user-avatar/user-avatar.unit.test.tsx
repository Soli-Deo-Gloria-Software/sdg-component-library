/* @jsxRuntime automatic */
/* @jsxImportSource @stencil/core */

import { describe, it, expect, render } from '@stencil/vitest';
import { getAvatarColor } from '../../utils/avatar-color';
import { AvatarSize } from '../../utils/enums/avatar-size';

describe('user-avatar', () => {
  it('renders initials with a name-derived background color', async () => {
    const name = 'Thomas Matthew Wood';
    const { root } = await render(<user-avatar name={name}></user-avatar>);

    const initials = root.shadowRoot?.querySelector('.avatar-initials');
    expect(initials?.textContent?.trim()).toBe('TMW');

    const background = root.shadowRoot?.querySelector('.avatar-background') as HTMLElement;
    expect(background?.getAttribute('style')).toContain(getAvatarColor(name));
  });

  it('keeps the same background color for the same name', async () => {
    const name = 'Jane Doe';
    const { root: first } = await render(<user-avatar name={name}></user-avatar>);
    const { root: second } = await render(<user-avatar name={name}></user-avatar>);

    const firstBg = (first.shadowRoot?.querySelector('.avatar-background') as HTMLElement).getAttribute('style');
    const secondBg = (second.shadowRoot?.querySelector('.avatar-background') as HTMLElement).getAttribute('style');

    expect(firstBg).toBe(secondBg);
    expect(firstBg).toContain(getAvatarColor(name));
  });

  it('applies size class for font scaling', async () => {
    const { root: sm } = await render(<user-avatar name="A B" size={AvatarSize.sm}></user-avatar>);
    const { root: lg } = await render(<user-avatar name="A B" size={AvatarSize.lg}></user-avatar>);

    expect(sm.shadowRoot?.querySelector('.avatar-container')?.classList.contains('sm')).toBe(true);
    expect(lg.shadowRoot?.querySelector('.avatar-container')?.classList.contains('lg')).toBe(true);
  });
});
