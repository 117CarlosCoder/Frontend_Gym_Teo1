export interface AsistenciaRegistro {
  idAsistencia: number;
  idSocio: number;
  nombreSocio: string;
  apellidoSocio: string;
  idSucursal: number | null;
  sucursal: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null;
  /** true mientras el socio no haya registrado su salida. */
  dentro: boolean;
  minutosPermanencia: number | null;
  registradoPor: string;
}

export interface RegistrarAsistenciaRequest {
  idSocio: number;
  idSucursal: number;
}

export interface SocioAsistencia {
  idSocio: number;
  nombre: string;
  apellido: string;
  estadoMembresia: string;
  tipoPlan: string;
}
