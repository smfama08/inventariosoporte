import { Injectable, signal, effect } from '@angular/core';

type Tema = 'claro' | 'oscuro';

/** Gestiona el modo oscuro y lo persiste en localStorage. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this.inicial());
  readonly esOscuro = signal(this.inicial() === 'oscuro');

  constructor() {
    effect(() => {
      const oscuro = this.esOscuro();
      document.documentElement.classList.toggle('dark', oscuro);
      this.tema.set(oscuro ? 'oscuro' : 'claro');
      localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro');
    });
  }

  toggle(): void {
    this.esOscuro.update((o) => !o);
  }

  private inicial(): Tema {
    const guardado = localStorage.getItem('tema');
    if (guardado === 'oscuro' || guardado === 'claro') return guardado;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
}

