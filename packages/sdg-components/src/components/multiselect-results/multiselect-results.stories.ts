import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { fn } from 'storybook/test';

type MultiselectResultsArgs = {
  items: Array<Record<string, string>>;
  maxInlineItems: number;
  labelKey: string;
  itemLabel: string;
  onItemRemoved?: (event: CustomEvent) => void;
};

const sampleItems = [
  { id: '1', label: 'Genesis 1:1' },
  { id: '2', label: 'John 3:16' },
  { id: '3', label: 'Romans 8:28' },
  { id: '4', label: 'Psalm 23:1' },
];

const meta: Meta<MultiselectResultsArgs> = {
  title: 'Components/Multiselect Results',
  component: 'multiselect-results',
  tags: ['autodocs'],
  args: {
    items: sampleItems,
    maxInlineItems: 2,
    labelKey: 'label',
    itemLabel: 'reference',
    onItemRemoved: fn(),
  },
  argTypes: {
    maxInlineItems: { control: { type: 'number', min: 0, max: 10 } },
    labelKey: { control: 'text' },
    itemLabel: { control: 'text' },
    items: { control: 'object' },
  },
  render: ({ items, maxInlineItems, labelKey, itemLabel, onItemRemoved }) => html`
    <multiselect-results
      .items=${items}
      max-inline-items=${maxInlineItems}
      label-key=${labelKey}
      item-label=${itemLabel}
      @itemRemoved=${onItemRemoved}
    ></multiselect-results>
  `,
};

export default meta;
type Story = StoryObj<MultiselectResultsArgs>;

export const Default: Story = {};

export const CompactOverflow: Story = {
  args: {
    maxInlineItems: 1,
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
