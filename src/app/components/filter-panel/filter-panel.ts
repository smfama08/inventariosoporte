import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Filter, RotateCcw } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';
import { FilterStateService } from '../../services/filter-state.service';
import { MultiselectComponent, Opcion } from '../multiselect/multiselect';
import { ESTADOS } from '../../core/constants';

/** Panel de filtros avanzados combinables. */
@Component({
  selector: 'app-filter-panel',
  imports: [FormsModule, LucideAngularModule, MultiselectComponent],
  template: `
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <lucide-icon [img]="icons.Filter" class="h-4 w-4" /> Filtros avanzados
        </h3>
        @if (fs.hayFiltros()) {
          <button (click)="fs.limpiar()" class="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600">
            <lucide-icon [img]="icons.RotateCcw" class="h-3.5 w-3.5" /> Limpiar
          </button>
        }
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Artículo</label>
          <app-multiselect etiqueta="Artículo" [opciones]="articulosOpc()" [seleccionados]="fs.filtros().articulos"
            (cambio)="fs.actualizar({ articulos: $event })" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Marca</label>
          <app-multiselect etiqueta="Marca" [opciones]="marcasOpc()" [seleccionados]="fs.filtros().marcas"
            (cambio)="fs.actualizar({ marcas: $event })" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Estado</label>
          <app-multiselect etiqueta="Estado" [opciones]="estadosOpc()" [seleccionados]="fs.filtros().estados"
            (cambio)="fs.actualizar({ estados: $event })" />
        </div>
        <!-- <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sucursal</label>
          <app-multiselect etiqueta="Sucursal" [opciones]="sucursalesOpc()" [seleccionados]="fs.filtros().sucursales"
            (cambio)="fs.actualizar({ sucursales: $event })" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Área</label>
          <app-multiselect etiqueta="Área" [opciones]="areasOpc()" [seleccionados]="fs.filtros().areas"
            (cambio)="fs.actualizar({ areas: $event })" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Proveedor</label>
          <app-multiselect etiqueta="Proveedor" [opciones]="proveedoresOpc()" [seleccionados]="fs.filtros().proveedores"
            (cambio)="fs.actualizar({ proveedores: $event })" />
        </div> -->
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-3 items-end">
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Localizado</label>
          <div class="flex items-center gap-3 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700">
            <button type="button" (click)="setLocalizado('todos')"
              class="text-xs px-2 py-1 rounded"
              [class.bg-corp-700]="fs.filtros().localizado === 'todos'"
              [class.text-white]="fs.filtros().localizado === 'todos'">Todos</button>
            <button type="button" (click)="setLocalizado('si')"
              class="text-xs px-2 py-1 rounded"
              [class.bg-green-600]="fs.filtros().localizado === 'si'"
              [class.text-white]="fs.filtros().localizado === 'si'">Sí</button>
            <button type="button" (click)="setLocalizado('no')"
              class="text-xs px-2 py-1 rounded"
              [class.bg-red-600]="fs.filtros().localizado === 'no'"
              [class.text-white]="fs.filtros().localizado === 'no'">No</button>
          </div>
        </div>
        <!-- <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fecha desde</label>
          <input type="date" [(ngModel)]="fechaDesde" (change)="aplicarFechas()"
            class="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fecha hasta</label>
          <input type="date" [(ngModel)]="fechaHasta" (change)="aplicarFechas()"
            class="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200" />
        </div> -->
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Texto en observaciones</label>
          <input type="text" [(ngModel)]="obsText" (input)="aplicarObs()"
            placeholder="Buscar en bitácora..."
            class="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200" />
        </div>
      </div>
    </div>
  `,
})
export class FilterPanelComponent implements OnInit {
  protected readonly fs = inject(FilterStateService);
  private readonly supabase = inject(SupabaseService);

  protected readonly iconosBase = { Filter, RotateCcw };
  protected readonly icons = this.iconosBase;

  articulosOpc = signal<Opcion[]>([]);
  marcasOpc = signal<Opcion[]>([]);
  estadosOpc = signal<Opcion[]>([]);
  sucursalesOpc = signal<Opcion[]>([]);
  areasOpc = signal<Opcion[]>([]);
  proveedoresOpc = signal<Opcion[]>([]);

  fechaDesde = '';
  fechaHasta = '';
  obsText = '';

  async ngOnInit(): Promise<void> {
    const [modelos, ubicaciones, proveedores] = await Promise.all([
      this.supabase.getModelos(),
      this.supabase.getUbicaciones(),
      this.supabase.getProveedores(),
    ]);

    this.articulosOpc.set(this.unicos(modelos.map((m) => m.articulo)));
    this.marcasOpc.set(this.unicos(modelos.map((m) => m.marca)));
    this.sucursalesOpc.set(this.unicos(ubicaciones.map((u) => u.sucursal)));
    this.areasOpc.set(this.unicos(ubicaciones.map((u) => u.area)));
    this.proveedoresOpc.set(proveedores.map((p) => ({ valor: p.nombre, etiqueta: p.nombre })));
    this.estadosOpc.set(ESTADOS.map((e) => ({ valor: e, etiqueta: e })));

    this.fechaDesde = this.fs.filtros().fechaDesde ?? '';
    this.fechaHasta = this.fs.filtros().fechaHasta ?? '';
    this.obsText = this.fs.filtros().textoObservaciones ?? '';
  }

  private unicos(valores: string[]): Opcion[] {
    return Array.from(new Set(valores.filter(Boolean))).map((v) => ({ valor: v, etiqueta: v }));
  }

  protected setLocalizado(v: 'todos' | 'si' | 'no'): void {
    this.fs.actualizar({ localizado: v });
  }

  protected aplicarFechas(): void {
    this.fs.actualizar({ fechaDesde: this.fechaDesde || null, fechaHasta: this.fechaHasta || null });
  }

  private obsTimer?: ReturnType<typeof setTimeout>;
  protected aplicarObs(): void {
    clearTimeout(this.obsTimer);
    this.obsTimer = setTimeout(() => {
      this.fs.actualizar({ textoObservaciones: this.obsText.trim() || null });
    }, 350);
  }
}

