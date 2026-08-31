import { environment } from '../../../environments/environment';

export const API = {
  auth: {
    login: `${environment.apiUrl}/auth/login`,
    logout: `${environment.apiUrl}/auth/logout`,
    perfil: `${environment.apiUrl}/auth/perfil`,
  },
  socios: `${environment.apiUrl}/socios`,
  membresias: `${environment.apiUrl}/membresias`,
  inscripciones: `${environment.apiUrl}/inscripciones`,
  clases: `${environment.apiUrl}/clases`,
  entrenadores: `${environment.apiUrl}/entrenadores`,
  asistencias: `${environment.apiUrl}/asistencias`,
} as const;

/** Llaves usadas en localStorage. */
export const STORAGE_KEYS = {
  sesion: 'gym.sesion',
} as const;
