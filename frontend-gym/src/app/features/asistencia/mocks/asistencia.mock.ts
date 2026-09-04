import { AsistenciaRegistro, SocioAsistencia, Sucursal } from '../models/asistencia.model';

export const MOCK_SUCURSALES: Sucursal[] = [
  { idSucursal: 1, nombre: 'Sucursal Centro - Zona 3', direccion: 'Quetzaltenango' },
  { idSucursal: 2, nombre: 'Sucursal Norte - Zona 7', direccion: 'Quetzaltenango' }
];

export const MOCK_ASISTENCIAS_HOY: AsistenciaRegistro[] = [
  {
    idAsistencia: 1,
    idSocio: 10,
    nombreSocio: 'Juan Carlos',
    apellidoSocio: 'Pérez Gómez',
    sucursal: 'Sucursal Centro - Zona 3',
    fecha: new Date().toISOString().split('T')[0],
    horaEntrada: '07:30:00',
    horaSalida: '09:00:00',
    registradoPor: 'Admin'
  },
  {
    idAsistencia: 2,
    idSocio: 11,
    nombreSocio: 'María Antonieta',
    apellidoSocio: 'Díaz López',
    sucursal: 'Sucursal Centro - Zona 3',
    fecha: new Date().toISOString().split('T')[0],
    horaEntrada: '08:15:00',
    horaSalida: null,
    registradoPor: 'Admin'
  },
  {
    idAsistencia: 3,
    idSocio: 12,
    nombreSocio: 'Carlos',
    apellidoSocio: 'Rodríguez',
    sucursal: 'Sucursal Norte - Zona 7',
    fecha: new Date().toISOString().split('T')[0],
    horaEntrada: '09:00:00',
    horaSalida: '10:30:00',
    registradoPor: 'Admin'
  },
  {
    idAsistencia: 4,
    idSocio: 13,
    nombreSocio: 'Ana',
    apellidoSocio: 'Martínez',
    sucursal: 'Sucursal Centro - Zona 3',
    fecha: new Date().toISOString().split('T')[0],
    horaEntrada: '14:00:00',
    horaSalida: null,
    registradoPor: 'Admin'
  },
  {
    idAsistencia: 5,
    idSocio: 14,
    nombreSocio: 'Luis',
    apellidoSocio: 'García',
    sucursal: 'Sucursal Norte - Zona 7',
    fecha: new Date().toISOString().split('T')[0],
    horaEntrada: '16:30:00',
    horaSalida: null,
    registradoPor: 'Admin'
  }
];

export const MOCK_SOCIOS_ASISTENCIA: SocioAsistencia[] = [
  { idSocio: 10, nombre: 'Juan Carlos', apellido: 'Pérez Gómez', estadoMembresia: 'Activa', tipoPlan: 'Plan Anual' },
  { idSocio: 11, nombre: 'María Antonieta', apellido: 'Díaz López', estadoMembresia: 'Activa', tipoPlan: 'Plan Mensual' },
  { idSocio: 12, nombre: 'Carlos', apellido: 'Rodríguez', estadoMembresia: 'Vencida', tipoPlan: 'Plan Trimestral' },
  { idSocio: 13, nombre: 'Ana', apellido: 'Martínez', estadoMembresia: 'Activa', tipoPlan: 'Plan Mensual VIP' },
  { idSocio: 14, nombre: 'Luis', apellido: 'García', estadoMembresia: 'Activa', tipoPlan: 'Plan Anual' }
];
