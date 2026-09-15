import { newSpecPage } from '@stencil/core/testing';
import { UserAvatar } from '../user-avatar';

describe('user-avatar', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [UserAvatar],
      html: `<user-avatar></user-avatar>`,
    });
    expect(page.root).toEqualHtml(`
      <user-avatar>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </user-avatar>
    `);
  });
});
