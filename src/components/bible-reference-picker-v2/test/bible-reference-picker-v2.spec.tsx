import { newSpecPage } from '@stencil/core/testing';
import { BibleReferencePickerV2 } from '../bible-reference-picker-v2';

describe('bible-reference-picker-v2', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [BibleReferencePickerV2],
      html: `<bible-reference-picker-v2></bible-reference-picker-v2>`,
    });
    expect(page.root).toEqualHtml(`
      <bible-reference-picker-v2>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </bible-reference-picker-v2>
    `);
  });
});
