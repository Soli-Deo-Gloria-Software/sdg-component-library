import { newE2EPage } from '@stencil/core/testing';

describe('bible-reference-picker', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<bible-reference-picker></bible-reference-picker>');

    const element = await page.find('bible-reference-picker');
    expect(element).toHaveClass('hydrated');
  });
});
