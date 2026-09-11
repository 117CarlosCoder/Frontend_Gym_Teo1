import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const token = inject(AuthService).token;

  // Si no hay token o es un token simulado de demo, no enviamos header Bearer inválido al backend
  if (!token || token.startsWith('demo-')) return siguiente(peticion);

  return siguiente(
    peticion.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
