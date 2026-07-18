import type { EstadoEquipo } from '../types';

/** Estados válidos del equipo, según la especificación de negocio. */
export const ESTADOS: EstadoEquipo[] = ['Nueva', 'Buena', 'Regular', 'Mala', 'En revisión'];

/** Mapa de estado -> configuración visual (emoji, color de acento, etiqueta). */
export interface ConfigEstado {
  emoji: string;
  color: string;
  colorFondo: string;
  colorTexto: string;
}

export const ESTADO_CONFIG: Record<EstadoEquipo, ConfigEstado> = {
  Nueva: { emoji: '🟢', color: '#16A34A', colorFondo: '#DCFCE7', colorTexto: '#166534' },
  Buena: { emoji: '🔵', color: '#2563EB', colorFondo: '#DBEAFE', colorTexto: '#1E40AF' },
  Regular: { emoji: '🟡', color: '#CA8A04', colorFondo: '#FEF9C3', colorTexto: '#854D0E' },
  Mala: { emoji: '🔴', color: '#DC2626', colorFondo: '#FEE2E2', colorTexto: '#991B1B' },
  'En revisión': { emoji: '⚫', color: '#4B5563', colorFondo: '#F3F4F6', colorTexto: '#374151' },
};

/** Devuelve la configuración visual de un estado, con un fallback seguro. */
export function configEstado(estado?: string | null): ConfigEstado {
  const key = (estado ?? '') as EstadoEquipo;
  return ESTADO_CONFIG[key] ?? { emoji: '⚪', color: '#9CA3AF', colorFondo: '#F3F4F6', colorTexto: '#6B7280' };
}

/** Paleta corporativa principal. */
export const PALETA = {
  primario: '#1E40AF',
  primarioHover: '#1E3A8A',
  grisFondo: '#F8FAFC',
  grisBorde: '#E2E8F0',
} as const;

