import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';

import { API, STORAGE_KEYS } from '../constants/api.constants';
import {
  BackendAuthResponse,
  BackendLoginRequest,
  LoginRequest,
  LoginResponse,
  SesionGuardada,
} from '../models/auth.model';
import { RolUsuario, UserResponseDto, Usuario } from '../models/usuario.model';
import { StorageService } from './storage.service';

const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  private readonly sesion = signal<SesionGuardada | null>(this.recuperarSesion());

  readonly usuario = computed<Usuario | null>(() => this.sesion()?.usuario ?? null);
  readonly estaAutenticado = computed(() => this.sesion() !== null);
  readonly rol = computed<RolUsuario | null>(() => this.usuario()?.rol ?? null);

  get token(): string | null {
    return this.sesion()?.token ?? null;
  }

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.loginReal(credenciales).pipe(
      catchError((err) => {
        const msg =
          err.backendError?.message ||
          err.error?.message ||
          err.message ||
          'Correo o contraseña incorrectos.';
        return throwError(() => new Error(msg));
      }),
      tap((respuesta) => this.abrirSesion(respuesta))
    );
  }

  logout(): void {
    if (this.token) {
      this.http.post(API.auth.logout, {}).subscribe({
        error: () => {},
      });
    }
    this.storage.eliminar(STORAGE_KEYS.sesion);
    this.sesion.set(null);
  }

  tieneRol(...roles: RolUsuario[]): boolean {
    const actual = this.rol();
    if (!actual) return false;
    return roles.some((r) => this.coincideRol(actual, r));
  }

  private coincideRol(actual: RolUsuario, esperado: RolUsuario): boolean {
    if (actual === esperado) return true;
    if (
      (actual === 'RECEPCIONISTA' && esperado === 'RECEPCION') ||
      (actual === 'RECEPCION' && esperado === 'RECEPCIONISTA')
    ) {
      return true;
    }
    if (
      (actual === 'CLIENTE' && esperado === 'SOCIO') ||
      (actual === 'SOCIO' && esperado === 'CLIENTE')
    ) {
      return true;
    }
    return false;
  }

  private normalizarRol(rol: string | null | undefined): RolUsuario {
    if (!rol) return 'CLIENTE';
    const r = rol.trim().toUpperCase();
    if (r === 'ADMIN') return 'ADMIN';
    if (r === 'RECEPCIONISTA' || r === 'RECEPCION') return 'RECEPCIONISTA';
    if (r === 'ENTRENADOR') return 'ENTRENADOR';
    if (r === 'CLIENTE' || r === 'SOCIO') return 'CLIENTE';
    return 'CLIENTE';
  }

  private mapearDtoAUsuario(dto: UserResponseDto, authRes: BackendAuthResponse): Usuario {
    return {
      id: dto.id ?? 0,
      dpi: dto.dpi ?? '',
      nombre: dto.nombres || authRes.correo.split('@')[0],
      apellido: dto.apellidos || '',
      correo: dto.correo || authRes.correo,
      telefono: dto.telefono,
      rol: this.normalizarRol(dto.rol || authRes.rol),
      activo: dto.estado ?? true,
      fecha_creacion: dto.creadoEn || new Date().toISOString(),
      doble_autenticacion: false,
      username: dto.correo?.split('@')[0] || 'usuario',
    };
  }

  private loginReal(credenciales: LoginRequest): Observable<LoginResponse> {
    const payload: BackendLoginRequest = {
      correo: credenciales.correo.trim(),
      contrasenia: credenciales.password,
    };

    return this.http.post<BackendAuthResponse>(API.auth.login, payload).pipe(
      switchMap((authRes) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${authRes.token}`,
        });

        return this.http.get<UserResponseDto>(API.auth.perfil, { headers }).pipe(
          map((perfil) => ({
            token: authRes.token,
            usuario: this.mapearDtoAUsuario(perfil, authRes),
          })),
          catchError(() => {
            const usuarioFallback: Usuario = {
              id: 0,
              dpi: '',
              nombre: authRes.correo.split('@')[0],
              apellido: '',
              correo: authRes.correo,
              rol: this.normalizarRol(authRes.rol),
              activo: true,
              fecha_creacion: new Date().toISOString(),
              doble_autenticacion: false,
              username: authRes.correo.split('@')[0],
            };
            return of({
              token: authRes.token,
              usuario: usuarioFallback,
            });
          }),
        );
      }),
    );
  }

  private abrirSesion(respuesta: LoginResponse): void {
    const sesion: SesionGuardada = {
      ...respuesta,
      expiraEn: Date.now() + DURACION_SESION_MS,
    };
    this.storage.guardar(STORAGE_KEYS.sesion, sesion);
    this.sesion.set(sesion);
  }

  private recuperarSesion(): SesionGuardada | null {
    const guardada = this.storage.obtener<SesionGuardada>(STORAGE_KEYS.sesion);
    if (!guardada) return null;

    if (
      guardada.expiraEn <= Date.now() ||
      !guardada.token ||
      guardada.token.startsWith('demo-') ||
      !guardada.token.includes('.')
    ) {
      this.storage.eliminar(STORAGE_KEYS.sesion);
      return null;
    }
    return guardada;
  }
}
