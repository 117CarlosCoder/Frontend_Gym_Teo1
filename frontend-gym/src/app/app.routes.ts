import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

/**
 * Todas las rutas se cargan de forma diferida (lazy) para que la página de
 * inicio pese lo mínimo posible.
 */
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
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-home/dashboard-home').then(
            (m) => m.DashboardHome,
          ),
        title: 'Panel | Claude Lovers Gym',
      },
      {
        path: 'portal-socio',
        loadComponent: () =>
          import('./features/socios/pages/portal-socio/portal-socio.component').then(
            (m) => m.PortalSocioComponent,
          ),
        title: 'Portal del Socio | Claude Lovers Gym',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
