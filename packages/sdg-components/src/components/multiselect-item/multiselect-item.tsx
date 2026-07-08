import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'multiselect-item',
  styleUrl: 'multiselect-item.css',
  shadow: true,
})
export class MultiselectItem {
  @Prop() itemReference: any;

  @Event() removeItem!: EventEmitter<any>;

  render() {
    return (
      <Host>
        <span class="item bg-light text-black"><slot></slot> &nbsp; |<span class="clickable" onClick={() => this.removeItem.emit(this.itemReference)}>&nbsp; &times; &nbsp;</span></span>
      </Host>
    );
  }
}
