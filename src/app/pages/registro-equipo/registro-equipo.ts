import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, Save, Plus } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';
import { ESTADOS } from '../../core/constants';
import type { ModeloHardware, Ubicacion, Proveedor } from '../../types';

interface OpcionCatalogo {
  valor: string;
  etiqueta: string;
}

/** Página de alta de un nuevo equipo.
 *  Permite crear al vuelo el modelo, la ubicación y el proveedor si no
 *  existen en el catálogo, para completar el registro en una sola pantalla. */
@Component({
  selector: 'app-registro-equipo',
  imports: [RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './registro-equipo.html',
})
export class RegistroEquipoComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly estados = ESTADOS;
  readonly guardando = signal(false);

  // Catálogos
  modelos = signal<ModeloHardware[]>([]);
  ubicaciones = signal<Ubicacion[]>([]);
  proveedores = signal<Proveedor[]>([]);

  // Campos del equipo
  numeroSerie = '';
  codigoFf = '';
  afReferencia = '';
  estado = '';
  localizado = false;
  fechaIngreso = '';

  // Modelo (selección o nuevo)
  modeloId = '';
  nuevoArticulo = '';
  nuevaMarca = '';
  nuevoModelo = '';

  // Ubicación (selección o nueva)
  ubicacionId = '';
  nuevaSucursal = '';
  nuevaArea = '';

  // Proveedor (selección o nuevo)
  proveedorId = '';
  nuevoProveedor = '';

  protected readonly icons = { ArrowLeft, Save, Plus };

  async ngOnInit(): Promise<void> {
    await this.cargarCatalogos();
  }

  private async cargarCatalogos(): Promise<void> {
    const [modelos, ubicaciones, proveedores] = await Promise.all([
      this.supabase.getModelos(),
      this.supabase.getUbicaciones(),
      this.supabase.getProveedores(),
    ]);
    this.modelos.set(modelos);
    this.ubicaciones.set(ubicaciones);
    this.proveedores.set(proveedores);
  }

  /** Indica si se está creando un modelo nuevo. */
  get creandoModelo(): boolean {
    return this.modeloId === '__nuevo__';
  }
  get creandoUbicacion(): boolean {
    return this.ubicacionId === '__nuevo__';
  }
  get creandoProveedor(): boolean {
    return this.proveedorId === '__nuevo__';
  }

  private validar(): string | null {
    if (!this.numeroSerie.trim()) return 'El número de serie es obligatorio';
    if (!this.modeloId) return 'Selecciona o crea un modelo';
    if (this.creandoModelo) {
      if (!this.nuevoArticulo.trim() || !this.nuevaMarca.trim() || !this.nuevoModelo.trim())
        return 'Completa artículo, marca y modelo';
    }
    if (!this.ubicacionId) return 'Selecciona o crea una ubicación';
    if (this.creandoUbicacion) {
      if (!this.nuevaSucursal.trim() || !this.nuevaArea.trim())
        return 'Completa sucursal y área';
    }
    if (!this.proveedorId) return 'Selecciona o crea un proveedor';
    if (this.creandoProveedor && !this.nuevoProveedor.trim())
      return 'Completa el nombre del proveedor';
    return null;
  }

  async guardar(): Promise<void> {
    const error = this.validar();
    if (error) {
      this.toast.error(error);
      return;
    }
    this.guardando.set(true);
    try {
      // 1. Modelo
      let modeloId = Number(this.modeloId);
      if (this.creandoModelo) {
        const m = await this.supabase.obtenerOCrearModelo({
          articulo: this.nuevoArticulo.trim(),
          marca: this.nuevaMarca.trim(),
          modelo: this.nuevoModelo.trim(),
        });
        modeloId = m.id;
      }

      // 2. Ubicación
      let ubicacionId = Number(this.ubicacionId);
      if (this.creandoUbicacion) {
        const u = await this.supabase.obtenerOCrearUbicacion({
          sucursal: this.nuevaSucursal.trim(),
          area: this.nuevaArea.trim(),
        });
        ubicacionId = u.id;
      }

      // 3. Proveedor
      let proveedorId = Number(this.proveedorId);
      if (this.creandoProveedor) {
        const p = await this.supabase.obtenerOCrearProveedor(this.nuevoProveedor.trim());
        proveedorId = p.id;
      }

      // 4. Equipo
      const equipo = await this.supabase.crearEquipo({
        numero_serie: this.numeroSerie.trim(),
        codigo_ff: this.codigoFf.trim() || null,
        af_referencia: this.afReferencia.trim() || null,
        modelo_id: modeloId,
        ubicacion_id: ubicacionId,
        proveedor_id: proveedorId,
        estado: this.estado || null,
        localizado: this.localizado,
        fecha_ingreso: this.fechaIngreso || null,
      });

      this.toast.success('Equipo registrado correctamente');
      this.router.navigate(['/equipo', equipo.id]);
    } catch (e: any) {
      this.toast.error(e?.message || 'Error al registrar el equipo');
    } finally {
      this.guardando.set(false);
    }
  }
}
