import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { fn } from 'storybook/test';

type UserAvatarArgs = {
  name: string;
  size: 'sm' | 'md' | 'lg';
  avatarStyle: 'square' | 'round' | 'rounded-square';
  src?: string;
  onReferencesUpdated?: () => void;
};

const meta: Meta<UserAvatarArgs> = {
  title: 'Components/User Avatar',
  component: 'user-avatar',
  tags: ['autodocs'],
  args: {
    name: 'Jane Doe',
    size: 'md',
    avatarStyle: 'round',
    src: '',
    onReferencesUpdated: fn(),
  },
  argTypes: {
    name: { control: 'text' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    avatarStyle: {
      control: 'select',
      options: ['square', 'round', 'rounded-square'],
    },
    src: {
      control: 'text',
      description: 'Optional image URL. Leave empty to show initials.',
    },
  },
  render: ({ name, size, avatarStyle, src, onReferencesUpdated }) => html`
    <user-avatar
      name=${name}
      size=${size}
      avatar-style=${avatarStyle}
      .src=${src || undefined}
      @referencesUpdated=${onReferencesUpdated}
    ></user-avatar>
  `,
};

export default meta;
type Story = StoryObj<UserAvatarArgs>;

export const Initials: Story = {};

export const WithImage: Story = {
  args: {
    name: 'Jeremy Boothby',
    src: 'https://media.sermonaudio.com/images/speakers/thumbnail/25960-0001.png',
    avatarStyle: 'round',
  },
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: end;">
      <user-avatar name="Small Avatar" size="sm" avatar-style="round"></user-avatar>
      <user-avatar name="Medium Avatar" size="md" avatar-style="round"></user-avatar>
      <user-avatar name="Large Avatar" size="lg" avatar-style="round"></user-avatar>
    </div>
  `,
};

export const Styles: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <user-avatar name="Square Style" size="md" avatar-style="square"></user-avatar>
      <user-avatar name="Rounded Square" size="md" avatar-style="rounded-square"></user-avatar>
      <user-avatar name="Round Style" size="md" avatar-style="round"></user-avatar>
    </div>
  `,
};
