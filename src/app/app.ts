import { Component, inject, viewChild, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Boxes, Search, Moon, Sun } from 'lucide-angular';
import { ThemeService } from './services/theme.service';
import { ToastService } from './services/toast.service';
import { GlobalSearchComponent } from './components/global-search/global-search';
import { ToastContainerComponent } from './components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    GlobalSearchComponent,
    ToastContainerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly theme = inject(ThemeService);
  protected readonly toast = inject(ToastService);
  private readonly searchRef = viewChild.required(GlobalSearchComponent);

  readonly icons = { LayoutDashboard, Boxes, Search, Moon, Sun };

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.searchRef().abrir();
    }
  }

  openSearch(): void {
    this.searchRef().abrir();
  }
}

