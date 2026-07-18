import { Injectable, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FILTROS_VACIOS, FiltrosInventario, SortableColumn, SortDirection } from '../types';

/**
 * Estado central de los filtros del inventario.
 * Única fuente de verdad: se sincroniza en ambas direcciones con la URL
 * para permitir compartir vistas filtradas y navegación atrás/adelante.
 */
@Injectable({ providedIn: 'root' })
export class FilterStateService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Filtros actuales como signal reactivo. */
  readonly filtros = signal<FiltrosInventario>(FILTROS_VACIOS);

  /** Ordenación y paginación también vivas en el estado. */
  readonly ordenarPor = signal<SortableColumn>('fecha_ingreso');
  readonly direccion = signal<SortDirection>('desc');
  readonly pagina = signal(1);
  readonly porPagina = signal(25);

  /** Indica si hay al menos un filtro activo. */
  readonly hayFiltros = signal(false);

  /** Reflejo de los query params de la URL como signal. */
  private readonly paramsSignal = toSignal(
    this.route.queryParams.pipe(map((p) => p ?? {})),
    { initialValue: {} as Record<string, string> },
  );

  constructor() {
    this.hidratarDesdeUrl(this.paramsSignal());
  }

  /** Aplica un cambio parcial a los filtros y persiste en la URL. */
  actualizar(parcial: Partial<FiltrosInventario>): void {
    const next: FiltrosInventario = { ...this.filtros(), ...parcial };
    this.filtros.set(next);
    this.pagina.set(1);
    this.persistir(next);
    this.recalcularHayFiltros();
  }

  /** Alterna un valor dentro de un filtro multiselect. */
  toggleEnLista(campo: keyof FiltrosInventario, valor: string): void {
    const lista = this.filtros()[campo] as string[];
    const existe = lista.includes(valor);
    const nextLista = existe ? lista.filter((v) => v !== valor) : [...lista, valor];
    this.actualizar({ [campo]: nextLista } as Partial<FiltrosInventario>);
  }

  /** Elimina un chip de filtro específico. */
  remover(campo: keyof FiltrosInventario, valor?: string): void {
    if (valor === undefined) {
      this.actualizar({ [campo]: [] } as Partial<FiltrosInventario>);
      return;
    }
    const lista = this.filtros()[campo] as string[];
    this.actualizar({ [campo]: lista.filter((v) => v !== valor) } as Partial<FiltrosInventario>);
  }

  limpiar(): void {
    this.filtros.set(FILTROS_VACIOS);
    this.hayFiltros.set(false);
    this.pagina.set(1);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  cambiarOrden(columna: SortableColumn): void {
    if (this.ordenarPor() === columna) {
      this.direccion.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(columna);
      this.direccion.set('asc');
    }
    this.persistir(this.filtros());
  }

  /** Convierte el estado a query params serializables. */
  private aParams(f: FiltrosInventario): Record<string, string> {
    const p: Record<string, string> = {};
    if (f.articulos.length) p['art'] = f.articulos.join(',');
    if (f.marcas.length) p['mar'] = f.marcas.join(',');
    if (f.estados.length) p['est'] = f.estados.join(',');
    if (f.sucursales.length) p['suc'] = f.sucursales.join(',');
    if (f.areas.length) p['are'] = f.areas.join(',');
    if (f.proveedores.length) p['pro'] = f.proveedores.join(',');
    if (f.localizado !== 'todos') p['loc'] = f.localizado;
    if (f.fechaDesde) p['fd'] = f.fechaDesde;
    if (f.fechaHasta) p['fh'] = f.fechaHasta;
    if (f.textoObservaciones) p['obs'] = f.textoObservaciones;
    p['ob'] = this.ordenarPor();
    p['dir'] = this.direccion();
    return p;
  }

  private persistir(f: FiltrosInventario): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.aParams(f),
      replaceUrl: true,
    });
  }

  /** Reconstruye el estado desde los query params de la URL. */
  private hidratarDesdeUrl(params: Record<string, string>): void {
    const split = (v?: string) => (v ? v.split(',').filter(Boolean) : []);
    const f: FiltrosInventario = {
      articulos: split(params['art']),
      marcas: split(params['mar']),
      estados: split(params['est']),
      sucursales: split(params['suc']),
      areas: split(params['are']),
      proveedores: split(params['pro']),
      localizado: (params['loc'] as FiltrosInventario['localizado']) || 'todos',
      fechaDesde: params['fd'] || null,
      fechaHasta: params['fh'] || null,
      textoObservaciones: params['obs'] || null,
    };
    this.filtros.set(f);
    if (params['ob']) this.ordenarPor.set(params['ob'] as SortableColumn);
    if (params['dir']) this.direccion.set(params['dir'] as SortDirection);
    this.recalcularHayFiltros();
  }

  private recalcularHayFiltros(): void {
    const f = this.filtros();
    const activo =
      f.articulos.length > 0 ||
      f.marcas.length > 0 ||
      f.estados.length > 0 ||
      f.sucursales.length > 0 ||
      f.areas.length > 0 ||
      f.proveedores.length > 0 ||
      f.localizado !== 'todos' ||
      !!f.fechaDesde ||
      !!f.fechaHasta ||
      !!f.textoObservaciones;
    this.hayFiltros.set(activo);
  }
}

