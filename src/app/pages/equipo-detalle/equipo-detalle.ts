import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LucideAngularModule, ArrowLeft, Plus, Cpu, History, UserCheck, NotebookPen, Trash2, Save, Pencil, Check } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';
import type { Equipo, BitacoraObservacion, Usuario, DetallesComputadora } from '../../types';
import { EstadoBadgeComponent } from '../../components/estado-badge/estado-badge';
import { ESTADOS } from '../../core/constants';

@Component({
  selector: 'app-equipo-detalle',
  imports: [RouterLink, FormsModule, DatePipe, LucideAngularModule, EstadoBadgeComponent],
  templateUrl: './equipo-detalle.html',
})
export class EquipoDetalleComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly equipo = signal<Equipo | null>(null);
  readonly observaciones = signal<BitacoraObservacion[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly guardandoObs = signal(false);
  nuevaObservacion = '';

  readonly estados = ESTADOS;
  protected readonly icons = { ArrowLeft, Plus, Cpu, History, UserCheck, NotebookPen, Trash2, Save, Pencil, Check };

  // --- Edición de información general ---
  readonly editandoGeneral = signal(false);
  g_numeroSerie = '';
  g_codigoFf = '';
  g_afReferencia = '';
  g_estado = '';
  g_localizado = false;
  g_fechaIngreso = '';
  readonly guardandoGeneral = signal(false);

  // --- Asignación ---
  readonly usuarioSeleccionado = signal<number | null>(null);
  asignacionNotas = '';
  asignacionFecha = '';
  readonly mostrarNuevoUsuario = signal(false);
  nu_nombre = '';
  nu_windows = '';
  nu_correo = '';
  nu_cargo = '';
  readonly guardandoAsignacion = signal(false);

  // --- Detalle de computadora ---
  readonly editandoDetalle = signal(false);
  det_nombre_equipo = '';
  det_procesador = '';
  det_memoria_ram = '';
  det_sistema_operativo = '';
  det_direccion_mac = '';
  det_protector = false;
  readonly guardandoDetalle = signal(false);

  // --- Historial AF ---
  nuevoAf = '';
  nuevoAfActivo = true;
  readonly guardandoAf = signal(false);

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    await Promise.all([
      this.cargarEquipo(id),
      this.cargarObservaciones(id),
      this.cargarUsuarios(),
    ]);
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

  private async cargarUsuarios(): Promise<void> {
    try {
      this.usuarios.set(await this.supabase.getUsuarios());
    } catch (err: any) {
      console.error('Error al cargar usuarios', err);
    }
  }

  // --- Observaciones ---
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

  // --- Edición de información general ---
  iniciarEdicionGeneral(): void {
    const e = this.equipo();
    if (!e) return;
    this.g_numeroSerie = e.numero_serie;
    this.g_codigoFf = e.codigo_ff ?? '';
    this.g_afReferencia = e.af_referencia ?? '';
    this.g_estado = e.estado ?? '';
    this.g_localizado = !!e.localizado;
    this.g_fechaIngreso = e.fecha_ingreso ?? '';
    this.editandoGeneral.set(true);
  }

  async guardarGeneral(): Promise<void> {
    const e = this.equipo();
    if (!e) return;
    if (!this.g_numeroSerie.trim()) {
      this.toast.error('El número de serie es obligatorio');
      return;
    }
    this.guardandoGeneral.set(true);
    try {
      await this.supabase.actualizarEquipo(e.id, {
        numero_serie: this.g_numeroSerie.trim(),
        codigo_ff: this.g_codigoFf.trim() || null,
        af_referencia: this.g_afReferencia.trim() || null,
        estado: this.g_estado || null,
        localizado: this.g_localizado,
        fecha_ingreso: this.g_fechaIngreso || null,
      });
      this.toast.success('Equipo actualizado');
      this.editandoGeneral.set(false);
      await this.cargarEquipo(e.id);
    } catch (err: any) {
      this.toast.error(err?.message || 'Error al actualizar equipo');
    } finally {
      this.guardandoGeneral.set(false);
    }
  }

  async eliminarEquipo(): Promise<void> {
    const e = this.equipo();
    if (!e) return;
    if (!confirm(`¿Eliminar el equipo ${e.numero_serie}? Esta acción no se puede deshacer.`)) return;
    try {
      await this.supabase.eliminarEquipo(e.id);
      this.toast.success('Equipo eliminado');
      this.router.navigate(['/inventario']);
    } catch (err: any) {
      this.toast.error(err?.message || 'Error al eliminar equipo');
    }
  }

  // --- Asignación de equipo ---
  async asignar(): Promise<void> {
    const equipoId = this.equipo()?.id;
    if (!equipoId) return;
    this.guardandoAsignacion.set(true);
    try {
      let usuarioId = this.usuarioSeleccionado();
      if (this.mostrarNuevoUsuario()) {
        if (!this.nu_nombre.trim()) {
          this.toast.error('El nombre del usuario es obligatorio');
          return;
        }
        const u = await this.supabase.obtenerOCrearUsuario({
          nombre_completo: this.nu_nombre.trim(),
          usuario_windows: this.nu_windows.trim() || null,
          correo: this.nu_correo.trim() || null,
          cargo: this.nu_cargo.trim() || null,
        });
        usuarioId = u.id;
        await this.cargarUsuarios();
      }
      if (!usuarioId) {
        this.toast.error('Selecciona o crea un usuario');
        return;
      }
      await this.supabase.asignarEquipo({
        equipo_id: equipoId,
        usuario_id: usuarioId,
        notas: this.asignacionNotas.trim() || null,
        fecha_asignacion: this.asignacionFecha || null,
      });
      this.toast.success('Equipo asignado');
      this.usuarioSeleccionado.set(null);
      this.asignacionNotas = '';
      this.asignacionFecha = '';
      this.mostrarNuevoUsuario.set(false);
      this.nu_nombre = this.nu_windows = this.nu_correo = this.nu_cargo = '';
      await this.cargarEquipo(equipoId);
    } catch (err: any) {
      this.toast.error(err?.message || 'Error al asignar equipo');
    } finally {
      this.guardandoAsignacion.set(false);
    }
  }

  async eliminarAsignacion(id: number): Promise<void> {
    try {
      await this.supabase.eliminarAsignacion(id);
      this.toast.success('Asignación eliminada');
      const equipoId = this.equipo()?.id;
      if (equipoId) await this.cargarEquipo(equipoId);
    } catch (err: any) {
      this.toast.error(err?.message || 'Error al eliminar asignación');
    }
  }

  // --- Detalle de computadora ---
  iniciarEdicionDetalle(): void {
    const d = this.equipo()?.detalles_computadora?.[0];
    this.det_nombre_equipo = d?.nombre_equipo ?? '';
    this.det_procesador = d?.procesador ?? '';
    this.det_memoria_ram = d?.memoria_ram ?? '';
    this.det_sistema_operativo = d?.sistema_operativo ?? '';
    this.det_direccion_mac = d?.direccion_mac ?? '';
    this.det_protector = d?.protector_sobretension ?? false;
    this.editandoDetalle.set(true);
  }

  async guardarDetalle(): Promise<void> {
    const equipoId = this.equipo()?.id;
    if (!equipoId) return;
    this.guardandoDetalle.set(true);
    try {
      const payload: Omit<DetallesComputadora, 'id' | 'created_at'> = {
        equipo_id: equipoId,
        nombre_equipo: this.det_nombre_equipo.trim() || null,
        procesador: this.det_procesador.trim() || null,
        memoria_ram: this.det_memoria_ram.trim() || null,
        sistema_operativo: this.det_sistema_operativo.trim() || null,
        direccion_mac: this.det_direccion_mac.trim() || null,
        protector_sobretension: this.det_protector,
      };
      await this.supabase.guardarDetalleComputadora(payload);
      this.toast.success('Detalle de computadora guardado');
      this.editandoDetalle.set(false);
      await this.cargarEquipo(equipoId);
    } catch (err: any) {
      this.toast.error(err?.message || 'Error al guardar detalle');
    } finally {
      this.guardandoDetalle.set(false);
    }
  }

  // --- Historial AF ---
  async agregarAf(): Promise<void> {
    const equipoId = this.equipo()?.id;
    const codigo = this.nuevoAf.trim();
    if (!equipoId || !codigo) return;
    this.guardandoAf.set(true);
    try {
      await this.supabase.agregarAf(equipoId, codigo, this.nuevoAfActivo);
      this.toast.success(this.nuevoAfActivo ? 'Nuevo AF activo registrado' : 'AF agregado');
      this.nuevoAf = '';
      this.nuevoAfActivo = true;
      await this.cargarEquipo(equipoId);
    } catch (err: any) {
      this.toast.error(err?.message || 'Error al agregar AF (¿código duplicado?)');
    } finally {
      this.guardandoAf.set(false);
    }
  }

  async activarAf(id: number, equipoId: number): Promise<void> {
    try {
      await this.supabase.activarAf(id, equipoId);
      this.toast.success('AF activo actualizado');
      await this.cargarEquipo(equipoId);
    } catch (err: any) {
      this.toast.error(err?.message || 'Error al activar AF');
    }
  }

  async eliminarAf(id: number): Promise<void> {
    try {
      await this.supabase.eliminarAf(id);
      this.toast.success('AF eliminado');
      const equipoId = this.equipo()?.id;
      if (equipoId) await this.cargarEquipo(equipoId);
    } catch (err: any) {
      this.toast.error(err?.message || 'Error al eliminar AF');
    }
  }
}
