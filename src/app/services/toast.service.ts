import { Injectable, signal } from '@angular/core';

export type TipoToast = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: TipoToast;
}

/** Servicio de notificaciones toast en memoria, con auto-cierre. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private contador = 0;

  private push(mensaje: string, tipo: TipoToast): void {
    const id = ++this.contador;
    this.toasts.update((t) => [...t, { id, mensaje, tipo }]);
    setTimeout(() => this.remover(id), 4000);
  }

  success(mensaje: string): void {
    this.push(mensaje, 'success');
  }
  error(mensaje: string): void {
    this.push(mensaje, 'error');
  }
  info(mensaje: string): void {
    this.push(mensaje, 'info');
  }
  warning(mensaje: string): void {
    this.push(mensaje, 'warning');
  }

  remover(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}

