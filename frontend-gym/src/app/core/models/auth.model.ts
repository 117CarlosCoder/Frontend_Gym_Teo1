import { Usuario } from './usuario.model';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface SesionGuardada extends LoginResponse {
  expiraEn: number;
}
