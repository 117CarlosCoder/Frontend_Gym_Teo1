import { Usuario } from './usuario.model';

export interface LoginRequest {
  correo: string;
  password: string;
}

/** Payload esperado por Spring Boot (LoginRequestDto) */
export interface BackendLoginRequest {
  correo: string;
  contrasenia: string;
}

/** Respuesta enviada por Spring Boot (AuthResponseDto) */
export interface BackendAuthResponse {
  token: string;
  correo: string;
  rol: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface SesionGuardada extends LoginResponse {
  expiraEn: number;
}
