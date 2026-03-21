import { newSpecPage } from '@stencil/core/testing';
import { BibleReferencePicker } from '../bible-reference-picker';

describe('bible-reference-picker', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [BibleReferencePicker],
      html: `<bible-reference-picker></bible-reference-picker>`,
    });
    expect(page.root).toEqualHtml(`
      <bible-reference-picker max-references="100">
        <mock:shadow-root>
          <div class="search-box">
            <div class="reference-box"></div>
            <div class="row">
              <input autocomplete="off" id="input" name="input" placeholder="Scripture Reference" type="text" value="">
            </div>
            <div class="result-box">
              <ul>
                <li class="listheader">Select Book</li>
              </ul>
            </div>
            <div class="result-box">
              <ul></ul>
            </div>
          </div>
        </mock:shadow-root>
      </bible-reference-picker>
    `);
  });
});
