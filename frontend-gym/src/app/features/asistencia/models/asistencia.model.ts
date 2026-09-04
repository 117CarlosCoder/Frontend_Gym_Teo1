export interface Sucursal {
  idSucursal: number;
  nombre: string;
  direccion: string;
}

export interface AsistenciaRegistro {
  idAsistencia: number;
  idSocio: number;
  nombreSocio: string;
  apellidoSocio: string;
  sucursal: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null;
  registradoPor: string;
}

export interface RegistrarAsistenciaRequest {
  idSocio: number;
  idSucursal: number;
  tipo: 'ENTRADA' | 'SALIDA';
}

export interface SocioAsistencia {
  idSocio: number;
  nombre: string;
  apellido: string;
  estadoMembresia: string;
  tipoPlan: string;
}
