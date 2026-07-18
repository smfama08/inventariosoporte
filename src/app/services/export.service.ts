import { Injectable, inject } from '@angular/core';
import * as XLSX from 'xlsx';
import { SupabaseService } from './supabase.service';
import { FiltrosInventario, FILTROS_VACIOS } from '../types';

interface FilaExport {
  'N° Serie': string;
  Artículo: string;
  Marca: string;
  Modelo: string;
  Estado: string;
  Sucursal: string;
  Área: string;
  Proveedor: string;
  Localizado: string;
  'Fecha Ingreso': string;
  'Código AF': string;
  'Usuario asignado': string;
}

/** Normaliza un equipo a una fila plana para exportación. */
function aFila(e: any): FilaExport {
  return {
    'N° Serie': e.numero_serie ?? '',
    Artículo: e.modelo?.articulo ?? '',
    Marca: e.modelo?.marca ?? '',
    Modelo: e.modelo?.modelo ?? '',
    Estado: e.estado ?? '',
    Sucursal: e.ubicacion?.sucursal ?? '',
    Área: e.ubicacion?.area ?? '',
    Proveedor: e.proveedor?.nombre ?? '',
    Localizado: e.localizado ? 'Sí' : 'No',
    'Fecha Ingreso': e.fecha_ingreso ? e.fecha_ingreso.slice(0, 10) : '',
    'Código AF': e.af_referencia ?? '',
    'Usuario asignado':
      e.asignaciones_equipos?.[0]?.usuario?.nombre_completo ?? '',
  };
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly supabase = inject(SupabaseService);

  /** Exporta a Excel (.xlsx) respetando los filtros aplicados, vía descarga. */
  async exportarExcel(filtros: FiltrosInventario = FILTROS_VACIOS): Promise<void> {
    const datos = await this.traerTodos(filtros);
    const ws = XLSX.utils.json_to_sheet(datos.map(aFila));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `inventario_${this.stamp()}.xlsx`);
  }

  /** Exporta a CSV respetando los filtros aplicados. */
  async exportarCsv(filtros: FiltrosInventario = FILTROS_VACIOS): Promise<void> {
    const datos = await this.traerTodos(filtros);
    const ws = XLSX.utils.json_to_sheet(datos.map(aFila));
    const csv = XLSX.utils.sheet_to_csv(ws);
    this.descargar(`inventario_${this.stamp()}.csv`, csv, 'text/csv;charset=utf-8;');
  }

  /** Recupera todos los equipos filtrados (sin paginación) para exportar. */
  private async traerTodos(filtros: FiltrosInventario) {
    let equipos: any[] = [];
    let pagina = 1;
    const porPagina = 1000;
    // Recorre páginas hasta agotar resultados.
    for (;;) {
      const res = await this.supabase.getEquiposPaginado({
        filtros,
        pagina,
        porPagina,
        ordenarPor: 'fecha_ingreso',
        direccion: 'desc',
      });
      equipos = equipos.concat(res.datos);
      if (equipos.length >= res.total || res.datos.length === 0) break;
      pagina++;
    }
    return equipos;
  }

  private stamp(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private descargar(nombre: string, contenido: string, tipo: string): void {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }
}

