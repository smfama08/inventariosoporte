import { Component, inject } from '@angular/core';
import { LucideAngularModule, Search } from 'lucide-angular';
import { App } from '../../app';

/** Botón que abre el buscador global Ctrl+K desde cualquier página. */
@Component({
  selector: 'app-global-search-trigger',
  imports: [LucideAngularModule],
  template: `
    <button
      type="button"
      (click)="abrir()"
      class="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full sm:w-64"
    >
      <lucide-icon [img]="icons.Search" class="h-4 w-4" />
      <span class="flex-1 text-left">Buscar equipo...</span>
      <kbd class="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl K</kbd>
    </button>
  `,
})
export class GlobalSearchTriggerComponent {
  private readonly app = inject(App);
  protected readonly icons = { Search };
  protected abrir(): void {
    this.app.openSearch();
  }
}

