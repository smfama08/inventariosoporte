/**
 * Modelo de dominio del inventario de soporte técnico.
 * Centraliza los tipos compartidos entre servicios y componentes.
 */

export type EstadoEquipo = 'Nueva' | 'Buena' | 'Regular' | 'Mala' | 'En revisión';

export interface Proveedor {
  id: number;
  nombre: string;
}

export interface Ubicacion {
  id: number;
  sucursal: string;
  area: string;
}

export interface ModeloHardware {
  id: number;
  articulo: string;
  marca: string;
  modelo: string;
}

export interface Usuario {
  id: number;
  nombre_completo: string;
  usuario_windows?: string | null;
  correo?: string | null;
  cargo?: string | null;
}

export interface DetallesComputadora {
  id: number;
  equipo_id: number;
  nombre_equipo?: string | null;
  procesador?: string | null;
  memoria_ram?: string | null;
  sistema_operativo?: string | null;
  direccion_mac?: string | null;
  protector_sobretension?: boolean | null;
}

export interface HistorialActivoFijo {
  id: number;
  equipo_id: number;
  codigo_af: string;
  estado_af?: string | null;
}

export interface AsignacionEquipo {
  id: number;
  equipo_id: number;
  usuario_id: number;
  notas?: string | null;
  fecha_asignacion?: string | null;
  usuario?: Usuario | null;
}

export interface BitacoraObservacion {
  id: number;
  equipo_id: number;
  observacion: string;
  created_at: string;
}

export interface Equipo {
  id: number;
  numero_serie: string;
  codigo_ff?: string | null;
  modelo_id?: number | null;
  ubicacion_id?: number | null;
  proveedor_id?: number | null;
  estado?: string | null;
  localizado?: boolean | null;
  fecha_ingreso?: string | null;
  af_referencia?: string | null;
  created_at?: string | null;
  modelo?: ModeloHardware | null;
  ubicacion?: Ubicacion | null;
  proveedor?: Proveedor | null;
  detalles_computadora?: DetallesComputadora[];
  historial_activo_fijo?: HistorialActivoFijo[];
  asignaciones_equipos?: AsignacionEquipo[];
  bitacora_observaciones?: BitacoraObservacion[];
}

/** Columnas por las que se puede ordenar la tabla en el servidor. */
export type SortableColumn =
  | 'numero_serie'
  | 'articulo'
  | 'marca'
  | 'modelo'
  | 'estado'
  | 'sucursal'
  | 'area'
  | 'proveedor'
  | 'localizado'
  | 'fecha_ingreso'
  | 'af_referencia'
  | 'usuario_asignado';

export type SortDirection = 'asc' | 'desc';

/** Conjunto completo de filtros aplicables al inventario. */
export interface FiltrosInventario {
  articulos: string[];
  marcas: string[];
  estados: string[];
  sucursales: string[];
  areas: string[];
  proveedores: string[];
  localizado: 'todos' | 'si' | 'no';
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  textoObservaciones?: string | null;
}

export const FILTROS_VACIOS: FiltrosInventario = {
  articulos: [],
  marcas: [],
  estados: [],
  sucursales: [],
  areas: [],
  proveedores: [],
  localizado: 'todos',
  fechaDesde: null,
  fechaHasta: null,
  textoObservaciones: null,
};

/** Parámetros de la consulta paginada del servidor. */
export interface ParametrosConsulta {
  filtros: FiltrosInventario;
  pagina: number;
  porPagina: number;
  ordenarPor: SortableColumn;
  direccion: SortDirection;
}

/** Respuesta estándar de una consulta paginada. */
export interface RespuestaPaginada<T> {
  datos: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

/** Métricas agregadas para el dashboard. */
export interface MetricasDashboard {
  totalEquipos: number;
  localizados: number;
  noLocalizados: number;
  porcentajeLocalizados: number;
  totalSucursales: number;
  totalProveedores: number;
  porEstado: { nombre: string; valor: number; color: string }[];
  porArticulo: { nombre: string; valor: number }[];
}

/** Resultado de búsqueda global (Ctrl+K). */
export interface ResultadoBusqueda {
  id: number;
  numero_serie: string;
  af_referencia?: string | null;
  articulo?: string | null;
  marca?: string | null;
  modelo?: string | null;
  sucursal?: string | null;
  usuario_asignado?: string | null;
}

