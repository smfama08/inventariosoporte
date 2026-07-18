import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type {
  Equipo,
  FiltrosInventario,
  MetricasDashboard,
  ParametrosConsulta,
  RespuestaPaginada,
  ResultadoBusqueda,
  SortableColumn,
  SortDirection,
  Ubicacion,
  Proveedor,
  ModeloHardware,
  BitacoraObservacion,
} from '../types';
import { configEstado } from '../core/constants';
import { environment } from '../../environments/environment';

const SELECT_EQUIPO = `
  *,
  modelo:modelo_id (*),
  ubicacion:ubicacion_id (*),
  proveedor:proveedor_id (*)
`;

const SELECT_DETALLE = `
  *,
  modelo:modelo_id (*),
  ubicacion:ubicacion_id (*),
  proveedor:proveedor_id (*),
  detalles_computadora (*),
  historial_activo_fijo (*),
  asignaciones_equipos (*, usuario:usuario_id (*)),
  bitacora_observaciones (*)
`;

/** Construye el filtro OR de texto para búsqueda dentro de tablas relacionadas. */
function filtroRelacionado(columna: string, valores: string[]): string | null {
  if (!valores.length) return null;
  return valores
    .map((v) => `${columna}.ilike.%${v.replace(/"/g, '')}%`)
    .join(',');
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
  );

  private handleError(contexto: string, error: PostgrestError | null): never {
    const mensaje = error ? `${contexto}: ${error.message}` : `${contexto}: error desconocido`;
    console.error(mensaje, error);
    throw new Error(mensaje);
  }

  private async safeQuery<T>(
    query: PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  ): Promise<T> {
    const { data, error } = await query;
    if (error) this.handleError('Consulta Supabase', error);
    return data as T;
  }

  /** Aplica los filtros combinables a una consulta de equipos.
   *  Los filtros sobre campos de tablas relacionadas usan la notación
   *  `fk.campo`, que Supabase resuelve como JOIN filtrante sobre el
   *  campo de texto (gracias al !inner en el select correspondiente). */
  private aplicarFiltros(
    query: ReturnType<SupabaseClient['from']>['select'] extends never ? never : any,
    filtros: FiltrosInventario,
  ) {
    if (filtros.articulos.length)
      query = query.in('modelo_id.articulo', filtros.articulos);
    if (filtros.marcas.length) query = query.in('modelo_id.marca', filtros.marcas);
    if (filtros.estados.length) query = query.in('estado', filtros.estados);
    if (filtros.sucursales.length)
      query = query.in('ubicacion_id.sucursal', filtros.sucursales);
    if (filtros.areas.length)
      query = query.in('ubicacion_id.area', filtros.areas);
    if (filtros.proveedores.length)
      query = query.in('proveedor_id.nombre', filtros.proveedores);
    if (filtros.localizado === 'si') query = query.eq('localizado', true);
    if (filtros.localizado === 'no') query = query.eq('localizado', false);
    if (filtros.fechaDesde) query = query.gte('fecha_ingreso', filtros.fechaDesde);
    if (filtros.fechaHasta) query = query.lte('fecha_ingreso', filtros.fechaHasta);
    return query;
  }

  /** Construye el string de select, embebiendo con !inner solo las
   *  relaciones que se están filtrando, para que actúen como JOIN
   *  filtrante y la relación venga poblada en el resultado. */
  private buildSelect(filtros: FiltrosInventario): string {
    const modeloInner = filtros.articulos.length > 0 || filtros.marcas.length > 0;
    const ubicInner = filtros.sucursales.length > 0 || filtros.areas.length > 0;
    const provInner = filtros.proveedores.length > 0;
    const obsInner = !!filtros.textoObservaciones;

    const modelo = modeloInner ? 'modelo:modelo_id!inner (*)' : 'modelo:modelo_id (*)';
    const ubic = ubicInner ? 'ubicacion:ubicacion_id!inner (*)' : 'ubicacion:ubicacion_id (*)';
    const prov = provInner ? 'proveedor:proveedor_id!inner (*)' : 'proveedor:proveedor_id (*)';
    const obs = obsInner ? ', bitacora_observaciones!inner (observacion)' : '';

    return `*, ${modelo}, ${ubic}, ${prov}${obs}`;
  }

  /** Consulta paginada de equipos aplicando los filtros en el servidor.
   *  Cada filtro es independiente (se aplican con AND entre campos
   *  distintos, OR dentro de cada multiselect). */
  async getEquiposPaginado(params: ParametrosConsulta): Promise<RespuestaPaginada<Equipo>> {
    const { filtros, pagina, porPagina, ordenarPor, direccion } = params;
    const desde = (pagina - 1) * porPagina;
    const hasta = desde + porPagina - 1;

    let query = this.supabase
      .from('equipos')
      .select(this.buildSelect(filtros), { count: 'exact' });

    query = this.aplicarFiltros(query, filtros);

    if (filtros.textoObservaciones) {
      query = query.ilike('bitacora_observaciones.observacion', `%${filtros.textoObservaciones}%`);
    }

    query = query
      .order(ordenarPor, { ascending: direccion === 'asc' })
      .range(desde, hasta);

    const { data, error, count } = await query;
    if (error) this.handleError('Consulta de equipos', error);
    return {
      datos: (data as unknown as Equipo[]) ?? [],
      total: count ?? 0,
      pagina,
      porPagina,
    };
  }

  /** Detalle completo de un equipo (incluye relaciones para expansión). */
  async getEquipoById(id: number): Promise<Equipo> {
    const data = await this.safeQuery<Equipo>(
      this.supabase.from('equipos').select(SELECT_DETALLE).eq('id', id).maybeSingle(),
    );
    if (!data) throw new Error(`Equipo con id ${id} no encontrado`);
    return this.normalizarRelaciones(data);
  }

  /** Normaliza las relaciones one-to-one (vienen como objeto) a arrays para
   *  que los templates puedan iterarlas de forma uniforme. */
  private normalizarRelaciones(e: Equipo): Equipo {
    const a = <T>(v: T | T[] | null | undefined): T[] =>
      v == null ? [] : Array.isArray(v) ? v : [v];
    return {
      ...e,
      detalles_computadora: a(e.detalles_computadora),
      historial_activo_fijo: a(e.historial_activo_fijo),
      asignaciones_equipos: a(e.asignaciones_equipos),
      bitacora_observaciones: a(e.bitacora_observaciones),
    };
  }

  /** Métricas agregadas para el dashboard, respetando los filtros activos. */
  async getMetricas(filtros: FiltrosInventario): Promise<MetricasDashboard> {
    let query = this.supabase.from('equipos').select(SELECT_EQUIPO);
    query = this.aplicarFiltros(query, filtros);
    const equipos = await this.safeQuery<Equipo[]>(query);

    const totalEquipos = equipos.length;
    const localizados = equipos.filter((e) => e.localizado).length;
    const noLocalizados = totalEquipos - localizados;
    const porcentajeLocalizados = totalEquipos ? Math.round((localizados / totalEquipos) * 100) : 0;

    const sucursales = new Set(equipos.map((e) => e.ubicacion?.sucursal).filter(Boolean));
    const proveedores = new Set(equipos.map((e) => e.proveedor?.nombre).filter(Boolean));

    const porEstadoMap = new Map<string, number>();
    for (const e of equipos) {
      const key = e.estado || 'Sin estado';
      porEstadoMap.set(key, (porEstadoMap.get(key) ?? 0) + 1);
    }
    const porEstado = Array.from(porEstadoMap.entries())
      .map(([nombre, valor]) => ({
        nombre,
        valor,
        color: (configEstado(nombre).color),
      }))
      .sort((a, b) => b.valor - a.valor);

    const porArticuloMap = new Map<string, number>();
    for (const e of equipos) {
      const key = e.modelo?.articulo || 'Sin artículo';
      porArticuloMap.set(key, (porArticuloMap.get(key) ?? 0) + 1);
    }
    const porArticulo = Array.from(porArticuloMap.entries())
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor);

    return {
      totalEquipos,
      localizados,
      noLocalizados,
      porcentajeLocalizados,
      totalSucursales: sucursales.size,
      totalProveedores: proveedores.size,
      porEstado,
      porArticulo,
    };
  }

  /** Búsqueda global en tiempo real (Ctrl+K) sobre múltiples campos. */
  async busquedaGlobal(termino: string, limite = 12): Promise<ResultadoBusqueda[]> {
    const t = termino.trim();
    if (t.length < 2) return [];
    const like = `%${t}%`;
    const { data, error } = await this.supabase
      .from('equipos')
      .select(
        `id, numero_serie, af_referencia,
         modelo:modelo_id (articulo, marca, modelo),
         ubicacion:ubicacion_id (sucursal),
         asignaciones_equipos (usuario:usuario_id (nombre_completo))`,
      )
      .or(`numero_serie.ilike.${like},af_referencia.ilike.${like}`)
      .limit(limite * 3);
    if (error) this.handleError('Búsqueda global', error);

    const resultados: ResultadoBusqueda[] = [];
    for (const e of (data as any[]) ?? []) {
      const usuario =
        e.asignaciones_equipos?.[0]?.usuario?.nombre_completo ??
        e.asignaciones_equipos?.[0]?.usuario?.nombre_completo ??
        null;
      resultados.push({
        id: e.id,
        numero_serie: e.numero_serie,
        af_referencia: e.af_referencia,
        articulo: e.modelo?.articulo,
        marca: e.modelo?.marca,
        modelo: e.modelo?.modelo,
        sucursal: e.ubicacion?.sucursal,
        usuario_asignado: usuario,
      });
    }
    // Filtro en cliente para campos de relaciones no cubiertos por el OR.
    return resultados
      .filter(
        (r) =>
          !termino ||
          [r.numero_serie, r.af_referencia, r.marca, r.modelo, r.sucursal, r.usuario_asignado]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(t.toLowerCase())),
      )
      .slice(0, limite);
  }

  // --- Catálogos para filtros ---
  async getProveedores(): Promise<Proveedor[]> {
    return (
      (await this.safeQuery<Proveedor[]>(
        this.supabase.from('proveedores').select('*').order('nombre'),
      )) ?? []
    );
  }

  async getUbicaciones(): Promise<Ubicacion[]> {
    return (
      (await this.safeQuery<Ubicacion[]>(
        this.supabase.from('ubicaciones').select('*').order('sucursal'),
      )) ?? []
    );
  }

  async getModelos(): Promise<ModeloHardware[]> {
    return (
      (await this.safeQuery<ModeloHardware[]>(
        this.supabase.from('modelos_hardware').select('*').order('articulo'),
      )) ?? []
    );
  }

  // --- Bitácora ---
  async getObservaciones(equipoId: number): Promise<BitacoraObservacion[]> {
    return (
      (await this.safeQuery<BitacoraObservacion[]>(
        this.supabase
          .from('bitacora_observaciones')
          .select('*')
          .eq('equipo_id', equipoId)
          .order('created_at', { ascending: false }),
      )) ?? []
    );
  }

  async addObservacion(equipoId: number, observacion: string): Promise<BitacoraObservacion> {
    return await this.safeQuery<BitacoraObservacion>(
      this.supabase
        .from('bitacora_observaciones')
        .insert({ equipo_id: equipoId, observacion })
        .select()
        .single(),
    );
  }
}

export type { SortableColumn, SortDirection };

