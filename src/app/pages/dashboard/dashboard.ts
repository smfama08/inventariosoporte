import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Boxes, MapPin, Truck, CheckCircle2 } from 'lucide-angular';
import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { SupabaseService } from '../../services/supabase.service';
import { FilterStateService } from '../../services/filter-state.service';
import { MetricasDashboard } from '../../types';
import { FilterChipsComponent, Chip } from '../../components/filter-chips/filter-chips';
import { SkeletonComponent } from '../../components/skeleton/skeleton';
import { GlobalSearchTriggerComponent } from '../../components/global-search-trigger/global-search-trigger';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    LucideAngularModule,
    NgxChartsModule,
    FilterChipsComponent,
    SkeletonComponent,
    GlobalSearchTriggerComponent,
  ],
  templateUrl: './dashboard.html',
  styles: [':host{display:block}'],
})
export class DashboardComponent implements OnInit {
  protected readonly fs = inject(FilterStateService);
  private readonly supabase = inject(SupabaseService);

  protected readonly metricas = signal<MetricasDashboard | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly chips = signal<Chip[]>([]);

  protected readonly iconos = { Boxes, MapPin, Truck, CheckCircle2 };
  protected readonly legendPos = LegendPosition.Right;

  protected readonly colorScheme: Color = {
    name: 'corp',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#2563EB', '#1D4ED8'],
  };
  protected readonly donaScheme: Color = {
    name: 'estados',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#16A34A', '#2563EB', '#CA8A04', '#DC2626', '#4B5563'],
  };

  constructor() {
    // Recarga métricas cuando cambian los filtros.
    effect(() => {
      const f = this.fs.filtros();
      void f;
      this.cargar();
    });
  }

  ngOnInit(): void {
    this.actualizarChips();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const m = await this.supabase.getMetricas(this.fs.filtros());
      this.metricas.set(m);
      this.actualizarChips();
    } catch (e: any) {
      this.error.set(e?.message || 'Error al cargar métricas');
    } finally {
      this.cargando.set(false);
    }
  }

  protected actualizarChips(): void {
    const f = this.fs.filtros();
    const chips: Chip[] = [];
    const add = (campo: string, vals: string[], etiqueta: string) =>
      vals.forEach((v) => chips.push({ campo, valor: v, etiqueta }));
    add('articulos', f.articulos, 'Artículo');
    add('marcas', f.marcas, 'Marca');
    add('estados', f.estados, 'Estado');
    add('sucursales', f.sucursales, 'Sucursal');
    add('areas', f.areas, 'Área');
    add('proveedores', f.proveedores, 'Proveedor');
    if (f.localizado !== 'todos')
      chips.push({ campo: 'localizado', valor: f.localizado === 'si' ? 'Sí' : 'No', etiqueta: 'Localizado' });
    if (f.fechaDesde) chips.push({ campo: 'fechaDesde', valor: f.fechaDesde, etiqueta: 'Desde' });
    if (f.fechaHasta) chips.push({ campo: 'fechaHasta', valor: f.fechaHasta, etiqueta: 'Hasta' });
    if (f.textoObservaciones) chips.push({ campo: 'textoObservaciones', valor: f.textoObservaciones, etiqueta: 'Obs' });
    this.chips.set(chips);
  }

  protected quitarChip(chip: Chip): void {
    if (chip.campo === 'fechaDesde' || chip.campo === 'fechaHasta' || chip.campo === 'textoObservaciones') {
      this.fs.remover(chip.campo as any);
    } else {
      this.fs.remover(chip.campo as any, chip.valor);
    }
  }
}

