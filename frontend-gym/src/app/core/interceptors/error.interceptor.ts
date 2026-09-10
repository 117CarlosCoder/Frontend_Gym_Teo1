import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { RUTAS } from '../constants/rutas.constants';
import { AuthService } from '../services/auth.service';

export class AppHttpError extends Error {
  status: number;
  backendError?: any;

  constructor(message: string, status: number, backendError?: any) {
    super(message);
    this.name = 'AppHttpError';
    this.status = status;
    this.backendError = backendError;
  }
}

export const errorInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return siguiente(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !peticion.url.includes('/auth/')) {
        auth.logout();
        router.navigate([RUTAS.login]);
      }
      const mensaje = mensajeDeError(error);
      const appError = new AppHttpError(mensaje, error.status, error.error);
      return throwError(() => appError);
    }),
  );
};

function mensajeDeError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión.';
  }

  // 1. Mensaje directo enviado por Spring Boot / GlobalExceptionHandler
  if (error.error?.message && typeof error.error.message === 'string') {
    return error.error.message;
  }
  if (error.error?.mensaje && typeof error.error.mensaje === 'string') {
    return error.error.mensaje;
  }
  if (error.error?.error && typeof error.error.error === 'string') {
    return error.error.error;
  }
  if (typeof error.error === 'string' && error.error.trim().length > 0) {
    return error.error;
  }

  // 2. Errores de validación múltiples de Spring Boot { campo: 'error' }
  if (error.error && typeof error.error === 'object') {
    const valores = Object.values(error.error);
    if (valores.length > 0 && typeof valores[0] === 'string') {
      return valores.join('. ');
    }
  }

  if (error.status === 401) return 'Correo o contraseña incorrectos.';
  if (error.status === 403) return 'No tienes permisos para esta acción.';
  if (error.status === 404) return 'El recurso solicitado no existe.';
  if (error.status >= 500) return 'Error interno del servidor. Intenta más tarde.';

  return 'Ocurrió un error inesperado.';
}
