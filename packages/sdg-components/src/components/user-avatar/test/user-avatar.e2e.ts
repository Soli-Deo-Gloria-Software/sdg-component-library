import { newE2EPage } from '@stencil/core/testing';

describe('user-avatar', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<user-avatar></user-avatar>');

    const element = await page.find('user-avatar');
    expect(element).toHaveClass('hydrated');
  });
});
