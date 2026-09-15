import { Component, Host, Prop, h, Event, EventEmitter } from '@stencil/core';
import { AvatarSize } from '../../utils/enums/avatar-size';

@Component({
  tag: 'user-avatar',
  styleUrl: 'user-avatar.css',
  styleUrls: ['../../shared-styles.css'],
  shadow: true,
})
export class UserAvatar {
  @Prop() src?: string;
  @Prop() name!: string;
  @Prop() displayCircle: boolean = false;
  @Prop() size: AvatarSize = AvatarSize.md;

  @Event() referencesUpdated!: EventEmitter;

  getInitials = ():string => {
    return this.name.split(' ').map(s => s.substring(0,1)).join('');
  }

  render() {
    return (
      <Host>
        <div class={{
          'avatar-container':true,
          'lg': this.size == AvatarSize.lg,
          'sm': this.size == AvatarSize.sm,
          'round': this.displayCircle}}
          onClick={this.referencesUpdated.emit}
          title={this.name}>
          <span class="avatar-background w-100 h-100 bg-secondary d-inline-block"></span>
          <div class="avatar-content w-100 h-100 d-flex">
            {this.src ? 
              (<img src={this.src} />) : 
              (<span class={{'mx-auto':true, 'text-light': true}}>{this.getInitials()}</span>)
            }
        </div>
      </div>
    </Host>
    );
  }
}
