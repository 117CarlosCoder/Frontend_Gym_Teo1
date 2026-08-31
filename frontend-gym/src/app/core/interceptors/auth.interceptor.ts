import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const token = inject(AuthService).token;

  if (!token) return siguiente(peticion);

  return siguiente(
    peticion.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
