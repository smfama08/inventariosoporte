import { Component, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronDown, Check, Search } from 'lucide-angular';

export interface Opcion {
  valor: string;
  etiqueta: string;
}

/** Dropdown multiselect con búsqueda interna y selección por checkboxes. */
@Component({
  selector: 'app-multiselect',
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="relative" #root>
      <button
        type="button"
        (click)="toggle()"
        class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-corp-500 transition-colors"
      >
        <span class="truncate text-slate-600 dark:text-slate-300">
          {{ etiqueta() }}
          @if (seleccionados().length) {
            <span class="ml-1 text-corp-700 dark:text-corp-200 font-medium">({{ seleccionados().length }})</span>
          }
        </span>
        <lucide-icon [img]="icons.ChevronDown" class="h-4 w-4 text-slate-400 shrink-0" />
      </button>

      @if (abierto()) {
        <div
          class="animate-fade-in absolute z-30 mt-1 w-full max-h-72 overflow-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
        >
          <div class="p-2 sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-2 px-2 rounded bg-slate-100 dark:bg-slate-800">
              <lucide-icon [img]="icons.Search" class="h-4 w-4 text-slate-400" />
              <input
                [(ngModel)]="busqueda"
                placeholder="Buscar..."
                class="w-full bg-transparent text-sm py-1.5 outline-none text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>
          <ul>
            @for (op of opcionesFiltradas(); track op.valor) {
              <li>
                <button
                  type="button"
                  (click)="toggleValor(op.valor)"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <span
                    class="h-4 w-4 rounded border flex items-center justify-center shrink-0"
                    [class.bg-corp-700]="esSeleccionado(op.valor)"
                    [class.border-corp-700]="esSeleccionado(op.valor)"
                    [class.border-slate-300]="!esSeleccionado(op.valor)"
                  >
                    @if (esSeleccionado(op.valor)) {
                      <lucide-icon [img]="icons.Check" class="h-3 w-3 text-white" />
                    }
                  </span>
                  {{ op.etiqueta }}
                </button>
              </li>
            } @empty {
              <li class="px-3 py-3 text-sm text-slate-400 text-center">Sin coincidencias</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class MultiselectComponent {
  readonly etiqueta = input.required<string>();
  readonly opciones = input.required<Opcion[]>();
  readonly seleccionados = input<string[]>([]);
  readonly cambio = output<string[]>();

  protected readonly abierto = signal(false);
  protected readonly busqueda = signal('');

  protected readonly icons = { ChevronDown, Check, Search };

  protected opcionesFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase();
    if (!q) return this.opciones();
    return this.opciones().filter((o) => o.etiqueta.toLowerCase().includes(q));
  });

  toggle(): void {
    this.abierto.update((a) => !a);
    this.busqueda.set('');
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  esSeleccionado(v: string): boolean {
    return this.seleccionados().includes(v);
  }

  toggleValor(v: string): void {
    const actual = this.seleccionados();
    const next = actual.includes(v) ? actual.filter((x) => x !== v) : [...actual, v];
    this.cambio.emit(next);
  }
}

