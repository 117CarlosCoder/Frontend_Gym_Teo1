import { Sucursal } from '../../../core/models/sucursal.model';
import { AuditoriaMembresia, Membresia, PlanMembresia } from '../models/membresia.model';

export const MOCK_PLANES: PlanMembresia[] = [
  {
    idPlan: 1,
    tipo: 'Mensual Completo',
    descripcion: 'Acceso completo a todas las áreas y clases.',
    precio: 250,
    beneficios: ['Acceso multisucursal', 'Clases grupales', 'Evaluación mensual'],
    activo: true,
  },
  {
    idPlan: 2,
    tipo: 'Trimestral',
    descripcion: 'Entrenamiento continuo con tarifa preferencial.',
    precio: 675,
    beneficios: ['Acceso multisucursal', 'Clases grupales', 'Una medición física'],
    activo: true,
  },
];

export const MOCK_SUCURSALES_MEMBRESIA: Sucursal[] = [
  { idSucursal: 1, nombre: 'Zona 1', direccion: '6a avenida 12-40, Zona 1', activa: true },
  { idSucursal: 2, nombre: 'Las Americas', direccion: 'Avenida Las Americas 18-20', activa: true },
  { idSucursal: 3, nombre: 'El Portal', direccion: 'Calzada El Portal 4-18', activa: true },
];

export const MOCK_MEMBRESIAS: Membresia[] = [
  {
    idMembresia: 1,
    idSocio: 10,
    nombreSocio: 'Juan Carlos Pérez Gómez',
    plan: MOCK_PLANES[0],
    fechaInicio: '2026-08-01',
    fechaFin: '2026-08-31',
    precio: 250,
    estado: 'ACTIVA',
    descripcionEstado: 'Membresía vigente',
    sucursales: [MOCK_SUCURSALES_MEMBRESIA[0], MOCK_SUCURSALES_MEMBRESIA[1]],
    eliminado: false,
    creadoPor: 1,
    creadoEn: '2026-08-01T08:15:00Z',
  },
];

export const MOCK_AUDITORIA_MEMBRESIAS: AuditoriaMembresia[] = [];