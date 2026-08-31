import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { RUTAS } from '../constants/rutas.constants';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return siguiente(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
        router.navigate([RUTAS.login]);
      }
      return throwError(() => new Error(mensajeDeError(error)));
    }),
  );
};

function mensajeDeError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión.';
  }
  if (error.status === 401) return 'Correo o contraseña incorrectos.';
  if (error.status === 403) return 'No tienes permisos para esta acción.';
  if (error.status === 404) return 'El recurso solicitado no existe.';
  if (error.status >= 500) return 'Error interno del servidor. Intenta más tarde.';

  return error.error?.mensaje ?? 'Ocurrió un error inesperado.';
}
