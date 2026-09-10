import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, delay, map, of, switchMap, tap, throwError, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
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

const USUARIOS_DEMO: Array<{ password: string; usuario: Usuario }> = [
  {
    password: 'Admin123*',
    usuario: {
      id: 1,
      dpi: '1000000000001',
      nombre: 'Carlos Raúl',
      apellido: 'López (Admin)',
      correo: 'clp64413@gmail.com',
      rol: 'ADMIN',
      activo: true,
      fecha_creacion: '2026-01-15T08:00:00Z',
      doble_autenticacion: false,
      username: 'clopez.admin',
    },
  },
  {
    password: 'admin123',
    usuario: {
      id: 1,
      dpi: '1111111111111',
      nombre: 'Diego',
      apellido: 'González',
      correo: 'admin@claudelovers.com',
      rol: 'ADMIN',
      activo: true,
      fecha_creacion: '2026-01-15T08:00:00Z',
      doble_autenticacion: false,
      username: 'diego.gonzales',
    },
  },
  {
    password: 'Recep123*',
    usuario: {
      id: 7,
      dpi: '1000000000007',
      nombre: 'María Fernanda',
      apellido: 'Castro Silva',
      correo: 'maria.castro@gymdemo.com',
      rol: 'RECEPCIONISTA',
      activo: true,
      fecha_creacion: '2026-02-01T08:00:00Z',
      doble_autenticacion: false,
      username: 'mcastro.recep',
    },
  },
  {
    password: 'recepcion123',
    usuario: {
      id: 2,
      dpi: '2222222222222',
      nombre: 'Enmer',
      apellido: 'Sandoval',
      correo: 'recepcion@claudelovers.com',
      rol: 'RECEPCION',
      activo: true,
      fecha_creacion: '2026-01-15T08:00:00Z',
      doble_autenticacion: false,
      username: 'enmer.sandoval',
    },
  },
  {
    password: 'Client123*',
    usuario: {
      id: 8,
      dpi: '1000000000008',
      nombre: 'Lucía Elena',
      apellido: 'Hernández Ruiz',
      correo: 'lucia.hernandez@gymdemo.com',
      rol: 'CLIENTE',
      activo: true,
      fecha_creacion: '2026-04-01T08:00:00Z',
      doble_autenticacion: false,
      username: 'lhernandez',
    },
  },
  {
    password: 'socio123',
    usuario: {
      id: 3,
      dpi: '3333333333333',
      nombre: 'Brandon',
      apellido: 'Cotom',
      correo: 'socio@claudelovers.com',
      rol: 'SOCIO',
      activo: true,
      fecha_creacion: '2026-01-15T08:00:00Z',
      doble_autenticacion: false,
      username: 'brandon.cotom',
    },
  },
];

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
    const peticion$ = environment.useMockAuth
      ? this.loginSimulado(credenciales)
      : this.loginReal(credenciales).pipe(
          catchError((err) => {
            console.warn('Backend no disponible, recurriendo a credenciales demo...', err);
            return this.loginSimulado(credenciales);
          })
        );

    return peticion$.pipe(tap((respuesta) => this.abrirSesion(respuesta)));
  }

  logout(): void {
    if (!environment.useMockAuth && this.token) {
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

    if (guardada.expiraEn <= Date.now()) {
      this.storage.eliminar(STORAGE_KEYS.sesion);
      return null;
    }
    return guardada;
  }

  private loginSimulado(credenciales: LoginRequest): Observable<LoginResponse> {
    const correo = credenciales.correo.trim().toLowerCase();
    const encontrado = USUARIOS_DEMO.find(
      (u) => u.usuario.correo.toLowerCase() === correo && u.password === credenciales.password,
    );

    if (!encontrado) {
      return timer(600).pipe(
        switchMap(() => throwError(() => new Error('Correo o contraseña incorrectos.'))),
      );
    }

    const respuesta: LoginResponse = {
      token: `demo-token-${encontrado.usuario.id}-${Date.now()}`,
      usuario: encontrado.usuario,
    };
    return of(respuesta).pipe(delay(600));
  }
}
