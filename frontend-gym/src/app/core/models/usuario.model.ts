/** Roles del sistema (homologados con el Backend MariaDB/Spring Boot). */
export type RolUsuario = 'ADMIN' | 'RECEPCIONISTA' | 'RECEPCION' | 'ENTRENADOR' | 'CLIENTE' | 'SOCIO';

export interface Usuario {
  id: number;
  dpi: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  rol: RolUsuario;
  activo: boolean;
  /** URL o iniciales para el avatar en el header del dashboard. */
  avatarUrl?: string;
  fecha_creacion: string | Date;
  doble_autenticacion: boolean;
  username: string;
}

/** DTO devuelto por el backend en /users/me y /users */
export interface UserResponseDto {
  id: number;
  dpi: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  correo: string;
  rol: string;
  estado: boolean;
  contraseniaTemporal?: string;
  creadoEn?: string;
  actualizadoEn?: string;
  eliminadoEn?: string;
}

/** DTO para crear un usuario desde administración */
export interface CreateUserDto {
  dpi: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  correo: string;
  rol: string;
}

/** DTO para actualizar un usuario desde administración */
export interface UpdateUserAdminDto {
  dpi?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  correo?: string;
  contrasenia?: string;
  rol?: string;
  estado?: boolean;
}

/** DTO para actualizar el perfil propio (/users/me) */
export interface UpdateProfileDto {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  correo?: string;
  contraseniaActual?: string;
  nuevaContrasenia?: string;
}

/** DTO de Rol devuelto por /roles */
export interface RolDto {
  id: number;
  nombre: string;
  descripcion?: string;
}

/** Etiqueta legible del rol, para mostrar en la interfaz. */
export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepción',
  RECEPCION: 'Recepción',
  ENTRENADOR: 'Entrenador',
  CLIENTE: 'Cliente / Socio',
  SOCIO: 'Socio',
};

