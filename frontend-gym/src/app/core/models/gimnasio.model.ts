export interface Socio {
  idSocio: number;
  nombre: string;
  apellido: string;
  telefono: string;
  correo?: string;
  fechaInscripcion: string;
}

export interface Membresia {
  idMembresia: number;
  tipo: string;
  precio: number;
  duracionDias: number;
  descripcion?: string;
  beneficios?: string[];
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
}
