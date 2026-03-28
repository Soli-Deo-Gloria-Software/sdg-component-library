import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'bible-reference-picker-v2',
  styleUrl: 'bible-reference-picker-v2.css',
  shadow: true,
})
export class BibleReferencePickerV2 {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
