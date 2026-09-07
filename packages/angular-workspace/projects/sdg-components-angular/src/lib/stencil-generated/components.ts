/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import { Components } from '@soli-deo-gloria-software/sdg-components';


@ProxyCmp({
  inputs: ['allowWholeBookSubmission', 'maxNumberOfReferences']
})
@Component({
  selector: 'bible-reference-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['allowWholeBookSubmission', 'maxNumberOfReferences'],
  outputs: ['referencesUpdated'],
  standalone: false
})
export class BibleReferencePicker {
  protected el: HTMLBibleReferencePickerElement;
  @Output() referencesUpdated = new EventEmitter<BibleReferencePickerCustomEvent<IBibleReferencePickerIBibleReference[]>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { BibleReferencePickerCustomEvent } from '@soli-deo-gloria-software/sdg-components';
import type { IBibleReference as IBibleReferencePickerIBibleReference } from '@soli-deo-gloria-software/sdg-components';

export declare interface BibleReferencePicker extends Components.BibleReferencePicker {

  referencesUpdated: EventEmitter<BibleReferencePickerCustomEvent<IBibleReferencePickerIBibleReference[]>>;
}


@ProxyCmp({
  inputs: ['itemReference']
})
@Component({
  selector: 'multiselect-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['itemReference'],
  outputs: ['removeItem'],
  standalone: false
})
export class MultiselectItem {
  protected el: HTMLMultiselectItemElement;
  @Output() removeItem = new EventEmitter<MultiselectItemCustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { MultiselectItemCustomEvent } from '@soli-deo-gloria-software/sdg-components';

export declare interface MultiselectItem extends Components.MultiselectItem {

  removeItem: EventEmitter<MultiselectItemCustomEvent<any>>;
}


@ProxyCmp({
  inputs: ['compactMediaQuery', 'itemLabel', 'items', 'labelKey', 'maxInlineItems']
})
@Component({
  selector: 'multiselect-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['compactMediaQuery', 'itemLabel', 'items', 'labelKey', 'maxInlineItems'],
  outputs: ['itemRemoved'],
  standalone: false
})
export class MultiselectResults {
  protected el: HTMLMultiselectResultsElement;
  @Output() itemRemoved = new EventEmitter<MultiselectResultsCustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { MultiselectResultsCustomEvent } from '@soli-deo-gloria-software/sdg-components';

export declare interface MultiselectResults extends Components.MultiselectResults {

  itemRemoved: EventEmitter<MultiselectResultsCustomEvent<any>>;
}


