import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { RUTAS } from '../constants/rutas.constants';
import { RolUsuario } from '../models/usuario.model';
import { AuthService } from '../services/auth.service';

export const rolGuard = (...rolesPermitidos: RolUsuario[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.tieneRol(...rolesPermitidos) ? true : router.createUrlTree([RUTAS.dashboard]);
  };
};
