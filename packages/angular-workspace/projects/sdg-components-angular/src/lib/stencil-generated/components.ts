/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import { Components } from 'sdg-components';


@ProxyCmp({
  inputs: ['maxNumberOfReferences']
})
@Component({
  selector: 'bible-reference-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['maxNumberOfReferences'],
  outputs: ['referencesUpdated'],
  standalone: false
})
export class BibleReferencePicker {
  protected el: HTMLBibleReferencePickerElement;
  @Output() referencesUpdated = new EventEmitter<BibleReferencePickerCustomEvent<IBibleReferencePickerBibleReference[]>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { BibleReferencePickerCustomEvent } from 'sdg-components';
import type { BibleReference as IBibleReferencePickerBibleReference } from 'sdg-components';

export declare interface BibleReferencePicker extends Components.BibleReferencePicker {

  referencesUpdated: EventEmitter<BibleReferencePickerCustomEvent<IBibleReferencePickerBibleReference[]>>;
}


