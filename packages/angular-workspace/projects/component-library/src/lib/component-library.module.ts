import { APP_INITIALIZER, NgModule } from '@angular/core';
import { DIRECTIVES } from './stencil-generated';
import { defineCustomElement } from 'stencil-library/my-component';

@NgModule({
  declarations: [...DIRECTIVES],
  exports: [...DIRECTIVES],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: () => defineCustomElement,
      multi: true
    }
  ]
})
export class ComponentLibraryModule {}
