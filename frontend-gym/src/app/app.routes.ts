import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { rolGuard } from './core/guards/rol.guard';
import { AuthService } from './core/services/auth.service';
import { inject } from '@angular/core';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/pages/home-page/home-page').then((m) => m.HomePage),
        title: 'Claude Lovers Gym | Entrena con propósito',
      },
    ],
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
    title: 'Iniciar sesión | Claude Lovers Gym',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout').then((m) => m.DashboardLayout),
    children: [
      {
        path: '',
        canMatch: [() => inject(AuthService).tieneRol('ADMIN', 'RECEPCION', 'RECEPCIONISTA', 'ENTRENADOR')],
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-home/dashboard-home').then(
            (m) => m.DashboardHome,
          ),
        title: 'Panel | Claude Lovers Gym',
      },
      {
        path: '',
        canMatch: [() => inject(AuthService).tieneRol('SOCIO', 'CLIENTE')],
        loadComponent: () =>
          import('./features/socios/pages/portal-socio/portal-socio.component').then(
            (m) => m.PortalSocioComponent,
          ),
        title: 'Portal del Socio | Claude Lovers Gym',
      },
      {
        path: 'portal-socio',
        canActivate: [rolGuard('SOCIO', 'CLIENTE')],
        loadComponent: () =>
          import('./features/socios/pages/portal-socio/portal-socio.component').then(
            (m) => m.PortalSocioComponent,
          ),
        title: 'Portal del Socio | Claude Lovers Gym',
      },
      {
        path: 'socios',
        canActivate: [rolGuard('ADMIN', 'RECEPCION', 'RECEPCIONISTA')],
        loadComponent: () =>
          import('./features/socios/pages/lista-socios/lista-socios.component').then(
            (m) => m.ListaSocios,
          ),
        title: 'Gestión de Miembros | Claude Lovers Gym',
      },
      {
        path: 'planes',
        canActivate: [rolGuard('ADMIN', 'RECEPCION', 'RECEPCIONISTA')],
        loadComponent: () =>
          import('./features/planes/pages/lista-planes/lista-planes.component').then(
            (m) => m.ListaPlanes,
          ),
        title: 'Planes de Membresía | Claude Lovers Gym',
      },
      {
        path: 'asistencia',
        canActivate: [rolGuard('ADMIN', 'RECEPCION', 'RECEPCIONISTA', 'ENTRENADOR')],
        loadComponent: () =>
          import('./features/asistencia/pages/registro-asistencia/registro-asistencia.component').then(
            (m) => m.RegistroAsistenciaComponent,
          ),
        title: 'Asistencia | Claude Lovers Gym',
      },
      {
        path: 'membresias',
        canActivate: [rolGuard('ADMIN', 'RECEPCION')],
        loadComponent: () =>
          import('./features/membresias/pages/gestion-membresias/gestion-membresias.component').then(
            (m) => m.GestionMembresiasComponent,
          ),
        title: 'Membresías | Claude Lovers Gym',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
