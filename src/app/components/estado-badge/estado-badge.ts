import { Component, input } from '@angular/core';
import { configEstado } from '../../core/constants';

/** Insignia visual de estado con emoji y color de acento. */
@Component({
  selector: 'app-estado-badge',
  imports: [],
  template: `
    <span
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      [style.background]="cfg().colorFondo"
      [style.color]="cfg().colorTexto"
    >
      <span class="text-[10px] leading-none">{{ cfg().emoji }}</span>
      {{ estado() || 'Sin estado' }}
    </span>
  `,
  styles: [':host{display:inline-flex}'],
})
export class EstadoBadgeComponent {
  readonly estado = input<string | null | undefined>(null);
  protected cfg = () => configEstado(this.estado());
}

