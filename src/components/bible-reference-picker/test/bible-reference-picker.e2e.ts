import { newE2EPage } from '@stencil/core/testing';

describe('bible-reference-picker-v2', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<bible-reference-picker-v2></bible-reference-picker-v2>');

    const element = await page.find('bible-reference-picker-v2');
    expect(element).toHaveClass('hydrated');
  });
});
