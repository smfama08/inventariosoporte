import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LucideAngularModule, ArrowLeft, Plus, Cpu, History, UserCheck, NotebookPen } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';
import type { Equipo, BitacoraObservacion } from '../../types';
import { EstadoBadgeComponent } from '../../components/estado-badge/estado-badge';

@Component({
  selector: 'app-equipo-detalle',
  imports: [RouterLink, FormsModule, DatePipe, LucideAngularModule, EstadoBadgeComponent],
  templateUrl: './equipo-detalle.html',
})
export class EquipoDetalleComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly equipo = signal<Equipo | null>(null);
  readonly observaciones = signal<BitacoraObservacion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly guardandoObs = signal(false);
  nuevaObservacion = '';

  protected readonly icons = { ArrowLeft, Plus, Cpu, History, UserCheck, NotebookPen };

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    await Promise.all([this.cargarEquipo(id), this.cargarObservaciones(id)]);
  }

  private async cargarEquipo(id: number): Promise<void> {
    try {
      this.equipo.set(await this.supabase.getEquipoById(id));
    } catch (err: any) {
      this.error.set(err?.message || 'Error al cargar equipo');
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarObservaciones(equipoId: number): Promise<void> {
    try {
      this.observaciones.set(await this.supabase.getObservaciones(equipoId));
    } catch (err: any) {
      console.error('Error al cargar observaciones', err);
    }
  }

  async agregarObservacion(): Promise<void> {
    const equipoId = this.equipo()?.id;
    const texto = this.nuevaObservacion.trim();
    if (!equipoId || !texto) return;
    this.guardandoObs.set(true);
    try {
      await this.supabase.addObservacion(equipoId, texto);
      this.nuevaObservacion = '';
      await this.cargarObservaciones(equipoId);
      this.toast.success('Observación registrada');
    } catch (err: any) {
      this.toast.error(err?.message || 'Error al guardar observación');
    } finally {
      this.guardandoObs.set(false);
    }
  }
}

