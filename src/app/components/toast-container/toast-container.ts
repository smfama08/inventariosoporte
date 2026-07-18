import { Component, inject } from '@angular/core';
import { LucideAngularModule, CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-angular';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [LucideAngularModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-full max-w-sm">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="animate-fade-in flex items-start gap-2 p-3 rounded-lg shadow-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          [class.border-green-300]="t.tipo === 'success'"
          [class.border-red-300]="t.tipo === 'error'"
          [class.border-amber-300]="t.tipo === 'warning'"
        >
          <lucide-icon
            [img]="icono(t.tipo)"
            class="h-5 w-5 shrink-0 mt-0.5"
            [class.text-green-500]="t.tipo === 'success'"
            [class.text-red-500]="t.tipo === 'error'"
            [class.text-blue-500]="t.tipo === 'info'"
            [class.text-amber-500]="t.tipo === 'warning'"
          />
          <span class="flex-1 text-sm text-slate-700 dark:text-slate-200">{{ t.mensaje }}</span>
          <button (click)="toast.remover(t.id)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <lucide-icon [img]="icons.X" class="h-4 w-4" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  protected readonly toast = inject(ToastService);
  protected readonly icons = { CheckCircle2, XCircle, Info, AlertTriangle, X };

  protected icono(tipo: string) {
    switch (tipo) {
      case 'success': return this.icons.CheckCircle2;
      case 'error': return this.icons.XCircle;
      case 'warning': return this.icons.AlertTriangle;
      default: return this.icons.Info;
    }
  }
}

