import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { fn } from 'storybook/test';

type MultiselectItemArgs = {
  label: string;
  itemReference: string;
  onRemoveItem?: (event: CustomEvent) => void;
};

const meta: Meta<MultiselectItemArgs> = {
  title: 'Components/Multiselect Item',
  component: 'multiselect-item',
  tags: ['autodocs'],
  args: {
    label: 'Genesis 1:1',
    itemReference: 'gen-1-1',
    onRemoveItem: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    itemReference: { control: 'text' },
  },
  render: ({ label, itemReference, onRemoveItem }) => html`
    <multiselect-item
      .itemReference=${itemReference}
      @removeItem=${onRemoveItem}
    >${label}</multiselect-item>
  `,
};

export default meta;
type Story = StoryObj<MultiselectItemArgs>;

export const Default: Story = {};
