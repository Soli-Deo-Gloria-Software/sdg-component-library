import { newSpecPage } from '@stencil/core/testing';
import { BibleReferencePicker } from '../bible-reference-picker';

describe('bible-reference-picker', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [BibleReferencePicker],
      html: `<bible-reference-picker></bible-reference-picker>`,
    });
    expect(page.root).toEqualHtml(`
      <bible-reference-picker>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </bible-reference-picker>
    `);
  });
});
