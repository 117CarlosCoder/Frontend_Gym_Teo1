import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { RUTAS } from '../constants/rutas.constants';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.estaAutenticado() ? router.createUrlTree([RUTAS.dashboard]) : true;
};
