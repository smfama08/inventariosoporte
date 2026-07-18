import { Routes } from '@angular/router';
import { InventarioComponent } from './pages/inventario/inventario';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { EquipoDetalleComponent } from './pages/equipo-detalle/equipo-detalle';
import { RegistroEquipoComponent } from './pages/registro-equipo/registro-equipo';

export const routes: Routes = [
  { path: '', redirectTo: '/inventario', pathMatch: 'full' },
  { path: 'inventario', component: InventarioComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'equipo/nuevo', component: RegistroEquipoComponent },
  { path: 'equipo/:id', component: EquipoDetalleComponent },
];

