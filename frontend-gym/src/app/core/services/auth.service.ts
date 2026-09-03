import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, of, switchMap, tap, throwError, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API, STORAGE_KEYS } from '../constants/api.constants';
import { LoginRequest, LoginResponse, SesionGuardada } from '../models/auth.model';
import { RolUsuario, Usuario } from '../models/usuario.model';
import { StorageService } from './storage.service';

const DURACION_SESION_MS = 8 * 60 * 60 * 1000;


const USUARIOS_DEMO: Array<{ password: string; usuario: Usuario }> = [
  {
    password: 'admin123',
    usuario: {
      id: 1,
      nombre: 'Diego',
      apellido: 'González',
      correo: 'admin@claudelovers.com',
      rol: 'ADMIN',
      activo: true,
      fecha_creacion: '2026-01-15T08:00:00Z',
      doble_autenticacion: false,
      username: 'diego.gonzales'
    },
  },
  {
    password: 'recepcion123',
    usuario: {
      id: 2,
      nombre: 'Enmer',
      apellido: 'Sandoval',
      correo: 'recepcion@claudelovers.com',
      rol: 'RECEPCION',
      activo: true,
      fecha_creacion: '2026-01-15T08:00:00Z',
      doble_autenticacion: false,
      username: 'enmer.sandoval'
    },
  },
  {
    password: 'socio123',
    usuario: {
      id: 3,
      nombre: 'Brandon',
      apellido: 'Cotom',
      correo: 'socio@claudelovers.com',
      rol: 'SOCIO',
      activo: true,
      fecha_creacion: '2026-01-15T08:00:00Z',
      doble_autenticacion: false,
      username: 'brandon.cotom'
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
      : this.http.post<LoginResponse>(API.auth.login, credenciales);

    return peticion$.pipe(tap((respuesta) => this.abrirSesion(respuesta)));
  }

  logout(): void {
    this.storage.eliminar(STORAGE_KEYS.sesion);
    this.sesion.set(null);
  }

  tieneRol(...roles: RolUsuario[]): boolean {
    const actual = this.rol();
    return actual !== null && roles.includes(actual);
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
      (u) => u.usuario.correo === correo && u.password === credenciales.password,
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
