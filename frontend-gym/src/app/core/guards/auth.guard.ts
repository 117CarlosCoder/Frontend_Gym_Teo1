import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { RUTAS } from '../constants/rutas.constants';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) return true;

  return router.createUrlTree([RUTAS.login], {
    queryParams: { redirigir: estado.url },
  });
};
