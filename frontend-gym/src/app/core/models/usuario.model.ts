/** Roles del sistema (Sprint 0 — pendiente de confirmar con el Product Owner). */
export type RolUsuario = 'ADMIN' | 'RECEPCION' | 'ENTRENADOR' | 'SOCIO';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  /** URL o iniciales para el avatar en el header del dashboard. */
  avatarUrl?: string;
}

/** Etiqueta legible del rol, para mostrar en la interfaz. */
export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  ADMIN: 'Administrador',
  RECEPCION: 'Recepción',
  ENTRENADOR: 'Entrenador',
  SOCIO: 'Socio',
};
