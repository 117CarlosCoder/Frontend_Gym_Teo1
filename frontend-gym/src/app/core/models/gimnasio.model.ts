export interface Socio {
  idSocio: number;
  nombre: string;
  apellido: string;
  telefono: string;
  correo?: string;
  fechaInscripcion: string;
}

export interface MembresiaSocio {
  idMembresia: number;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: string;
  descripcionEstado: string;
  tipo: string;
  precio: number;
  duracionDias: number;
  descripcion?: string;
}

export interface Inscripcion {
  idInscripcion: number;
  idSocio: number;
  idMembresia: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface Entrenador {
  idEntrenador: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  telefono?: string;
}

export interface Clase {
  idClase: number;
  idEntrenador: number;
  nombre: string;
  horario: string;
  cupoMaximo?: number;
}

export interface AsistenciaClase {
  idSocio: number;
  idClase: number;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null; // null si aún está dentro
}
