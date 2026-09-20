import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { fn } from 'storybook/test';

type BibleReferencePickerArgs = {
  maxNumberOfReferences: number;
  allowWholeBookSubmission: boolean;
  onReferencesUpdated?: (event: CustomEvent) => void;
};

const meta: Meta<BibleReferencePickerArgs> = {
  title: 'Components/Bible Reference Picker',
  component: 'bible-reference-picker',
  tags: ['autodocs'],
  args: {
    maxNumberOfReferences: 4,
    allowWholeBookSubmission: true,
    onReferencesUpdated: fn(),
  },
  argTypes: {
    maxNumberOfReferences: { control: { type: 'number', min: 1, max: 20 } },
    allowWholeBookSubmission: { control: 'boolean' },
  },
  render: ({ maxNumberOfReferences, allowWholeBookSubmission, onReferencesUpdated }) => html`
    <div style="max-width: 28rem; height: 400px;">
      <label class="form-label" for="picker">Scripture</label>
      <bible-reference-picker
        id="picker"
        class="form-control"
        max-number-of-references=${maxNumberOfReferences}
        .allowWholeBookSubmission=${allowWholeBookSubmission}
        @referencesUpdated=${onReferencesUpdated}
      ></bible-reference-picker>
    </div>
  `,
};

export default meta;
type Story = StoryObj<BibleReferencePickerArgs>;

export const Default: Story = {};

export const SingleReference: Story = {
  args: {
    maxNumberOfReferences: 1,
    allowWholeBookSubmission: false,
  },
};
