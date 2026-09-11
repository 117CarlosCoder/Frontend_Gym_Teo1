import { environment } from '../../../environments/environment';

export const API = {
  auth: {
    login: `${environment.apiUrl}/auth/signin`,
    logout: `${environment.apiUrl}/auth/signout`,
    perfil: `${environment.apiUrl}/users/me`,
  },
  usuarios: `${environment.apiUrl}/users`,
  roles: `${environment.apiUrl}/roles`,
  socios: `${environment.apiUrl}/socios`,
  planes: `${environment.apiUrl}/planes`,
  membresias: `${environment.apiUrl}/membresias`,
  inscripciones: `${environment.apiUrl}/inscripciones`,
  clases: `${environment.apiUrl}/clases`,
  entrenadores: `${environment.apiUrl}/entrenadores`,
  asistencias: `${environment.apiUrl}/asistencias`,
} as const;

/** Llaves usadas en localStorage. */
export const STORAGE_KEYS = {
  sesion: 'gym.sesion',
  socios: 'gym.socios',
  planes: 'gym.planes',
  asistencias: 'gym.asistencias',
} as const;

