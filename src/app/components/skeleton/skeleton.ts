import { Component, input } from '@angular/core';

/** Bloque de esqueleto de carga (shimmer) para estados de carga. */
@Component({
  selector: 'app-skeleton',
  template: `
    <div
      class="skeleton rounded"
      [style.width]="ancho()"
      [style.height]="alto()"
    ></div>
  `,
})
export class SkeletonComponent {
  readonly ancho = input<string>('100%');
  readonly alto = input<string>('1rem');
}

