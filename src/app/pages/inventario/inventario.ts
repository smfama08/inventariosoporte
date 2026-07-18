import { Component, signal, computed, inject, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  LucideAngularModule,
  Download,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  FileSpreadsheet,
  FileText,
  X,
  SlidersHorizontal,
} from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';
import { FilterStateService } from '../../services/filter-state.service';
import { ExportService } from '../../services/export.service';
import { ToastService } from '../../services/toast.service';
import {
  Equipo,
  SortableColumn,
  SortDirection,
} from '../../types';
import { Chip } from '../../components/filter-chips/filter-chips';
import { EstadoBadgeComponent } from '../../components/estado-badge/estado-badge';
import { SkeletonComponent } from '../../components/skeleton/skeleton';
import { FilterPanelComponent } from '../../components/filter-panel/filter-panel';
import { FilterChipsComponent } from '../../components/filter-chips/filter-chips';
import { GlobalSearchTriggerComponent } from '../../components/global-search-trigger/global-search-trigger';

interface Columna {
  key: SortableColumn;
  label: string;
  ancho: number;
}

@Component({
  selector: 'app-inventario',
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    LucideAngularModule,
    EstadoBadgeComponent,
    SkeletonComponent,
    FilterPanelComponent,
    FilterChipsComponent,
    GlobalSearchTriggerComponent,
  ],
  templateUrl: './inventario.html',
})
export class InventarioComponent {
  private readonly supabase = inject(SupabaseService);
  protected readonly fs = inject(FilterStateService);
  private readonly exportarSvc = inject(ExportService);
  private readonly toast = inject(ToastService);

  protected readonly equipos = signal<Equipo[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');

  protected readonly seleccionados = signal<Set<number>>(new Set<number>());
  protected readonly expandidos = signal<Set<number>>(new Set<number>());

  protected readonly columnas = signal<Columna[]>([
    { key: 'numero_serie', label: 'N° Serie', ancho: 140 },
    { key: 'articulo', label: 'Artículo', ancho: 140 },
    { key: 'marca', label: 'Marca', ancho: 110 },
    { key: 'modelo', label: 'Modelo', ancho: 130 },
    { key: 'estado', label: 'Estado', ancho: 120 },
    { key: 'sucursal', label: 'Sucursal', ancho: 130 },
    { key: 'area', label: 'Área', ancho: 120 },
    { key: 'proveedor', label: 'Proveedor', ancho: 140 },
    { key: 'localizado', label: 'Localizado', ancho: 100 },
    { key: 'fecha_ingreso', label: 'Fecha Ingreso', ancho: 130 },
    { key: 'af_referencia', label: 'Código AF', ancho: 140 },
    { key: 'usuario_asignado', label: 'Usuario asignado', ancho: 170 },
  ]);

  protected readonly iconos = {
    Download,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Search,
    FileSpreadsheet,
    FileText,
    X,
    SlidersHorizontal,
  };

  protected readonly opcionesPorPagina = [10, 25, 50, 100];

  protected readonly chips = computed<Chip[]>(() => {
    const f = this.fs.filtros();
    const c: Chip[] = [];
    const add = (campo: keyof typeof f, vals: string[], etiqueta: string) =>
      (vals as string[]).forEach((v) => c.push({ campo: campo as string, valor: v, etiqueta }));
    add('articulos', f.articulos, 'Artículo');
    add('marcas', f.marcas, 'Marca');
    add('estados', f.estados, 'Estado');
    add('sucursales', f.sucursales, 'Sucursal');
    add('areas', f.areas, 'Área');
    add('proveedores', f.proveedores, 'Proveedor');
    if (f.localizado !== 'todos')
      c.push({ campo: 'localizado', valor: f.localizado === 'si' ? 'Sí' : 'No', etiqueta: 'Localizado' });
    if (f.fechaDesde) c.push({ campo: 'fechaDesde', valor: f.fechaDesde, etiqueta: 'Desde' });
    if (f.fechaHasta) c.push({ campo: 'fechaHasta', valor: f.fechaHasta, etiqueta: 'Hasta' });
    if (f.textoObservaciones) c.push({ campo: 'textoObservaciones', valor: f.textoObservaciones, etiqueta: 'Obs' });
    return c;
  });

  protected readonly totalPaginas = computed(() => {
    const pp = this.fs.porPagina();
    return Math.max(1, Math.ceil(this.total() / pp));
  });

  protected readonly rangoDesde = computed(() => {
    const t = this.total();
    if (t === 0) return 0;
    return (this.fs.pagina() - 1) * this.fs.porPagina() + 1;
  });

  protected readonly rangoHasta = computed(() => {
    return Math.min(this.total(), this.fs.pagina() * this.fs.porPagina());
  });

  protected readonly todosVisiblesSeleccionados = computed(() => {
    const eq = this.equipos();
    const sel = this.seleccionados();
    return eq.length > 0 && eq.every((e) => sel.has(e.id));
  });

  private redimensionando: { indice: number; inicioX: number; anchoInicio: number } | null = null;

  constructor() {
    effect(() => {
      const filtros = this.fs.filtros();
      const ordenarPor = this.fs.ordenarPor();
      const direccion = this.fs.direccion();
      const pagina = this.fs.pagina();
      const porPagina = this.fs.porPagina();
      void filtros;
      void ordenarPor;
      void direccion;
      void pagina;
      void porPagina;
      void this.cargar();
    });
  }

  /** Recarga los datos desde el servidor según el estado actual de filtros/orden/paginación. */
  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const res = await this.supabase.getEquiposPaginado({
        filtros: this.fs.filtros(),
        pagina: this.fs.pagina(),
        porPagina: this.fs.porPagina(),
        ordenarPor: this.fs.ordenarPor(),
        direccion: this.fs.direccion(),
      });
      this.equipos.set(res.datos);
      this.total.set(res.total);
    } catch (e: any) {
      this.error.set(e?.message || 'Error al cargar el inventario');
    } finally {
      this.cargando.set(false);
    }
  }

  // --- Ordenación ---
  protected ordenar(col: SortableColumn): void {
    this.fs.cambiarOrden(col);
  }

  protected flechaPara(col: SortableColumn): 'up' | 'down' | null {
    if (this.fs.ordenarPor() !== col) return null;
    return this.fs.direccion() === 'asc' ? 'up' : 'down';
  }

  // --- Selección múltiple ---
  protected toggleTodos(): void {
    const sel = new Set(this.seleccionados());
    if (this.todosVisiblesSeleccionados()) {
      this.equipos().forEach((e) => sel.delete(e.id));
    } else {
      this.equipos().forEach((e) => sel.add(e.id));
    }
    this.seleccionados.set(sel);
  }

  protected toggleSeleccion(id: number): void {
    const sel = new Set(this.seleccionados());
    if (sel.has(id)) sel.delete(id);
    else sel.add(id);
    this.seleccionados.set(sel);
  }

  protected limpiarSeleccion(): void {
    this.seleccionados.set(new Set<number>());
  }

  // --- Filas expandibles ---
  protected toggleExpandido(id: number): void {
    const exp = new Set(this.expandidos());
    if (exp.has(id)) exp.delete(id);
    else exp.add(id);
    this.expandidos.set(exp);
  }

  protected estaExpandido(id: number): boolean {
    return this.expandidos().has(id);
  }

  // --- Redimensión de columnas ---
  protected iniciarRedimension(indice: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const col = this.columnas()[indice];
    this.redimensionando = { indice, inicioX: event.clientX, anchoInicio: col.ancho };

    const onMove = (e: MouseEvent) => {
      if (!this.redimensionando) return;
      const delta = e.clientX - this.redimensionando.inicioX;
      const nuevoAncho = Math.max(80, this.redimensionando.anchoInicio + delta);
      this.columnas.update((cols) => {
        const next = [...cols];
        next[this.redimensionando!.indice] = { ...next[this.redimensionando!.indice], ancho: nuevoAncho };
        return next;
      });
    };

    const onUp = () => {
      this.redimensionando = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // --- Reordenamiento de columnas (drag & drop) ---
  private dragDesde: number | null = null;

  protected onDragStart(indice: number, event: DragEvent): void {
    this.dragDesde = indice;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(indice));
    }
  }

  protected onDrop(indice: number): void {
    if (this.dragDesde === null || this.dragDesde === indice) return;
    this.reordenar(this.dragDesde, indice);
    this.dragDesde = null;
  }

  protected reordenar(desde: number, hasta: number): void {
    if (desde < 0 || hasta < 0) return;
    this.columnas.update((cols) => {
      const next = [...cols];
      const [movido] = next.splice(desde, 1);
      next.splice(hasta, 0, movido);
      return next;
    });
  }

  // --- Paginación ---
  protected cambiarPorPagina(pp: number): void {
    this.fs.porPagina.set(pp);
    this.fs.pagina.set(1);
  }

  protected paginaAnterior(): void {
    const p = this.fs.pagina();
    if (p > 1) this.fs.pagina.set(p - 1);
  }

  protected paginaSiguiente(): void {
    const p = this.fs.pagina();
    if (p < this.totalPaginas()) this.fs.pagina.set(p + 1);
  }

  protected irPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) this.fs.pagina.set(p);
  }

  protected paginasVisibles(): number[] {
    const total = this.totalPaginas();
    const actual = this.fs.pagina();
    const rango = 2;
    const inicio = Math.max(1, actual - rango);
    const fin = Math.min(total, actual + rango);
    const nums: number[] = [];
    for (let i = inicio; i <= fin; i++) nums.push(i);
    return nums;
  }

  // --- Chips de filtros ---
  protected quitarChip(chip: Chip): void {
    if (chip.campo === 'fechaDesde' || chip.campo === 'fechaHasta' || chip.campo === 'textoObservaciones') {
      this.fs.remover(chip.campo as any);
    } else {
      this.fs.remover(chip.campo as any, chip.valor);
    }
  }

  // --- Exportación ---
  protected async exportarExcel(): Promise<void> {
    try {
      await this.exportarSvc.exportarExcel(this.fs.filtros());
      this.toast.success('Archivo Excel generado');
    } catch (e: any) {
      this.toast.error(e?.message || 'Error al exportar Excel');
    }
  }

  protected async exportarCsv(): Promise<void> {
    try {
      await this.exportarSvc.exportarCsv(this.fs.filtros());
      this.toast.success('Archivo CSV generado');
    } catch (e: any) {
      this.toast.error(e?.message || 'Error al exportar CSV');
    }
  }

  // --- Accesores de campos derivados ---
  protected usuarioAsignado(e: Equipo): string {
    return e.asignaciones_equipos?.[0]?.usuario?.nombre_completo ?? '—';
  }

  protected textoLocalizado(e: Equipo): string {
    return e.localizado ? 'Sí' : 'No';
  }
}

