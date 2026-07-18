import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Search, CornerDownLeft } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';
import { ResultadoBusqueda } from '../../types';

/** Buscador global (Ctrl+K) con resultados en tiempo real. */
@Component({
  selector: 'app-global-search',
  imports: [FormsModule, LucideAngularModule],
  template: `
    @if (abierto()) {
      <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/40 backdrop-blur-sm"
        (click)="cerrar()"
      >
        <div
          class="animate-fade-in w-full max-w-xl mx-4 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center gap-2 px-4 border-b border-slate-200 dark:border-slate-700">
            <lucide-icon [img]="icons.Search" class="h-5 w-5 text-slate-400" />
            <input
              #inputEl
              [(ngModel)]="termino"
              (input)="buscar()"
              (keydown.escape)="cerrar()"
              (keydown.enter)="irAlPrimero()"
              placeholder="Buscar por serie, AF, usuario, sucursal, marca o modelo..."
              class="w-full bg-transparent py-4 text-sm outline-none text-slate-700 dark:text-slate-100 placeholder:text-slate-400"
            />
            <kbd class="font-mono text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          <div class="max-h-80 overflow-auto">
            @if (cargando()) {
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div class="skeleton h-9 w-9 rounded-full"></div>
                  <div class="flex-1 space-y-1.5">
                    <div class="skeleton h-3 w-1/3"></div>
                    <div class="skeleton h-2.5 w-1/2"></div>
                  </div>
                </div>
              }
            } @else if (resultados().length) {
              @for (r of resultados(); track r.id) {
                <button
                  type="button"
                  (click)="ir(r)"
                  class="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div class="h-9 w-9 rounded-full bg-corp-50 dark:bg-corp-900/40 flex items-center justify-center text-corp-700 dark:text-corp-200">
                    <lucide-icon [img]="icons.Search" class="h-4 w-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-mono text-sm text-slate-800 dark:text-slate-100 truncate">{{ r.numero_serie }}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {{ r.marca }} {{ r.modelo }} · {{ r.sucursal }}
                      @if (r.usuario_asignado) { · {{ r.usuario_asignado }} }
                    </div>
                  </div>
                  <lucide-icon [img]="icons.CornerDownLeft" class="h-4 w-4 text-slate-300" />
                </button>
              }
            } @else if (termino().length >= 2) {
              <div class="px-4 py-8 text-center text-sm text-slate-400">Sin resultados</div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class GlobalSearchComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  protected readonly abierto = signal(false);
  protected readonly termino = signal('');
  protected readonly resultados = signal<ResultadoBusqueda[]>([]);
  protected readonly cargando = signal(false);

  protected readonly icons = { Search, CornerDownLeft };

  private timer?: ReturnType<typeof setTimeout>;

  abrir(): void {
    this.abierto.set(true);
    this.termino.set('');
    this.resultados.set([]);
    setTimeout(() => {
      const el = document.querySelector('app-global-search input') as HTMLInputElement;
      el?.focus();
    });
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  buscar(): void {
    clearTimeout(this.timer);
    this.cargando.set(true);
    this.timer = setTimeout(async () => {
      const res = await this.supabase.busquedaGlobal(this.termino());
      this.resultados.set(res);
      this.cargando.set(false);
    }, 200);
  }

  ir(r: ResultadoBusqueda): void {
    this.cerrar();
    this.router.navigate(['/equipo', r.id]);
  }

  irAlPrimero(): void {
    const primero = this.resultados()[0];
    if (primero) this.ir(primero);
  }
}

