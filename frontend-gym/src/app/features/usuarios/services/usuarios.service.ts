import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API } from '../../../core/constants/api.constants';
import {
  CreateUserDto,
  RolDto,
  UpdateProfileDto,
  UpdateUserAdminDto,
  UserResponseDto,
} from '../../../core/models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly http = inject(HttpClient);

  /**
   * Obtiene la lista completa de usuarios del sistema (ADMIN o RECEPCIONISTA).
   */
  getUsuarios(): Observable<UserResponseDto[]> {
    return this.http.get<UserResponseDto[]>(API.usuarios).pipe(
      catchError((error) => {
        console.error('Error al obtener usuarios:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene un usuario específico por su ID.
   */
  getUsuarioById(id: number): Observable<UserResponseDto> {
    return this.http.get<UserResponseDto>(`${API.usuarios}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error al obtener usuario ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Crea un nuevo usuario en el sistema (Solo rol ADMIN).
   * La contraseña se genera de forma automática y segura en el backend.
   */
  crearUsuario(dto: CreateUserDto): Observable<UserResponseDto> {
    return this.http.post<UserResponseDto>(API.usuarios, dto).pipe(
      catchError((error) => {
        console.error('Error al crear usuario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza los datos de un usuario por parte del Administrador (Solo ADMIN).
   */
  actualizarUsuarioAdmin(id: number, dto: UpdateUserAdminDto): Observable<UserResponseDto> {
    return this.http.put<UserResponseDto>(`${API.usuarios}/${id}`, dto).pipe(
      catchError((error) => {
        console.error(`Error al actualizar usuario ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Desactiva un usuario por ID (Soft delete, Solo ADMIN).
   */
  desactivarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${API.usuarios}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error al desactivar usuario ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene el perfil del usuario autenticado en sesión actual (/users/me).
   */
  getMiPerfil(): Observable<UserResponseDto> {
    return this.http.get<UserResponseDto>(API.auth.perfil).pipe(
      catchError((error) => {
        console.error('Error al obtener mi perfil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza datos personales y/o contraseña del usuario autenticado actual (/users/me).
   */
  actualizarMiPerfil(dto: UpdateProfileDto): Observable<UserResponseDto> {
    return this.http.put<UserResponseDto>(API.auth.perfil, dto).pipe(
      catchError((error) => {
        console.error('Error al actualizar mi perfil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Consulta el catálogo de roles del sistema (/roles).
   */
  getRoles(): Observable<RolDto[]> {
    return this.http.get<RolDto[]>(API.roles).pipe(
      catchError((error) => {
        console.warn('No se pudo cargar el catálogo de roles desde el backend, usando catálogo base:', error);
        return throwError(() => error);
      })
    );
  }
}

