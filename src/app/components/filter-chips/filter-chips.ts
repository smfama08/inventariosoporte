import { Component, input, output } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

export interface Chip {
  campo: string;
  valor: string;
  etiqueta: string;
}

/** Barra de chips removibles que refleja los filtros activos. */
@Component({
  selector: 'app-filter-chips',
  imports: [LucideAngularModule],
  template: `
    @if (chips().length) {
      <div class="flex flex-wrap items-center gap-2">
        @for (chip of chips(); track chip.campo + chip.valor) {
          <span
            class="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-xs bg-corp-50 dark:bg-corp-900/40 text-corp-700 dark:text-corp-200 border border-corp-100 dark:border-corp-800"
          >
            <span class="font-medium opacity-70">{{ chip.etiqueta }}:</span>
            <span class="font-mono">{{ chip.valor }}</span>
            <button
              (click)="quitar.emit(chip)"
              class="ml-0.5 p-0.5 rounded-full hover:bg-corp-100 dark:hover:bg-corp-800"
              [attr.aria-label]="'Quitar ' + chip.valor"
            >
              <lucide-icon [img]="icons.X" class="h-3 w-3" />
            </button>
          </span>
        }
        <button
          (click)="limpiar.emit()"
          class="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 underline"
        >
          Limpiar todo
        </button>
      </div>
    }
  `,
})
export class FilterChipsComponent {
  readonly chips = input.required<Chip[]>();
  readonly quitar = output<Chip>();
  readonly limpiar = output<void>();
  protected readonly icons = { X };
}

