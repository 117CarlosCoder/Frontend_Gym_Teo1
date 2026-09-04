/**
 * Contenido de la landing page.
 * Vive separado del componente para que, cuando el backend exponga
 * /membresias, /clases y /entrenadores, solo haya que cambiar la fuente
 * de datos y no la plantilla.
 */

export interface Estadistica {
  valor: string;
  etiqueta: string;
}

export interface Servicio {
  titulo: string;
  descripcion: string;
  /** Atributo `d` de un <path> SVG de 24x24. */
  icono: string;
}

export interface PlanMembresia {
  nombre: string;
  precio: number;
  periodo: string;
  descripcion: string;
  beneficios: string[];
  destacado: boolean;
}

export interface EntrenadorPublico {
  nombre: string;
  iniciales: string;
  especialidad: string;
  experiencia: string;
}

export interface ClaseHorario {
  nombre: string;
  dias: string;
  hora: string;
  entrenador: string;
}

export const ESTADISTICAS: Estadistica[] = [
  { valor: '+500', etiqueta: 'Socios activos' },
  { valor: '25', etiqueta: 'Clases por semana' },
  { valor: '12', etiqueta: 'Entrenadores certificados' },
  { valor: '5:00', etiqueta: 'Abrimos todos los días' },
];

export const SERVICIOS: Servicio[] = [
  {
    titulo: 'Área de musculación',
    descripcion:
      'Más de 60 máquinas y peso libre con mantenimiento e inventario controlado desde el sistema.',
    icono: 'M4 8h2v8H4zM7 6h2v12H7zM15 6h2v12h-2zM18 8h2v8h-2zM10 11h4v2h-4z',
  },
  {
    titulo: 'Cardio y resistencia',
    descripcion:
      'Caminadoras, elípticas y bicicletas con rutinas guiadas para mejorar tu capacidad aeróbica.',
    icono: 'M13 2l-8 12h6l-1 8 8-12h-6l1-8z',
  },
  {
    titulo: 'Clases dirigidas',
    descripcion:
      'Spinning, funcional, yoga y box. Reserva tu cupo y controla tu asistencia en línea.',
    icono: 'M12 4a3 3 0 110 6 3 3 0 010-6zm-7 16a7 7 0 0114 0v1H5v-1z',
  },
  {
    titulo: 'Entrenamiento personal',
    descripcion:
      'Un entrenador asignado a tu perfil, con seguimiento de rutinas y avance mes a mes.',
    icono: 'M12 2l2.4 6.9L21 9.2l-5 4.6 1.4 7.2L12 17.6 6.6 21l1.4-7.2-5-4.6 6.6-.3L12 2z',
  },
  {
    titulo: 'Control de membresías',
    descripcion: 'Tu plan, tus pagos y tu fecha de vencimiento siempre visibles desde tu cuenta.',
    icono: 'M3 5h18v4H3V5zm0 6h18v8H3v-8zm2 4h6v2H5v-2z',
  },
  {
    titulo: 'Asesoría nutricional',
    descripcion:
      'Planes de alimentación acompañados de mediciones periódicas y reportes de progreso.',
    icono:
      'M12 2c3 0 5 2.5 5 6 0 5-3 9-5 14-2-5-5-9-5-14 0-3.5 2-6 5-6zm0 3a3 3 0 100 6 3 3 0 000-6z',
  },
];

export const PLANES: PlanMembresia[] = [
  {
    nombre: 'Básico',
    precio: 150,
    periodo: 'mensual',
    descripcion: 'Ideal si vas empezando y quieres entrenar por tu cuenta.',
    beneficios: [
      'Acceso al área de musculación',
      'Acceso a cardio',
      'Horario de 5:00 a 22:00',
      'Control de asistencia digital',
    ],
    destacado: false,
  },
  {
    nombre: 'Full',
    precio: 250,
    periodo: 'mensual',
    descripcion: 'El plan más elegido: entrenas y participas en todas las clases.',
    beneficios: [
      'Todo lo del plan Básico',
      'Clases dirigidas ilimitadas',
      'Evaluación física mensual',
      'Reserva de cupos en línea',
      'Acceso a lockers',
    ],
    destacado: true,
  },
  {
    nombre: 'Premium',
    precio: 400,
    periodo: 'mensual',
    descripcion: 'Acompañamiento completo con entrenador y nutrición.',
    beneficios: [
      'Todo lo del plan Full',
      'Entrenador personal asignado',
      'Plan nutricional mensual',
      'Rutina personalizada',
      'Invitado gratis una vez al mes',
    ],
    destacado: false,
  },
];

export const ENTRENADORES: EntrenadorPublico[] = [
  {
    nombre: 'Andrea Morales',
    iniciales: 'AM',
    especialidad: 'Entrenamiento funcional',
    experiencia: '8 años de experiencia',
  },
  {
    nombre: 'Luis Pérez',
    iniciales: 'LP',
    especialidad: 'Fuerza e hipertrofia',
    experiencia: '10 años de experiencia',
  },
  {
    nombre: 'Karla Ramírez',
    iniciales: 'KR',
    especialidad: 'Yoga y movilidad',
    experiencia: '6 años de experiencia',
  },
  {
    nombre: 'Mario Cifuentes',
    iniciales: 'MC',
    especialidad: 'Boxeo y acondicionamiento',
    experiencia: '9 años de experiencia',
  },
];

export const CLASES: ClaseHorario[] = [
  {
    nombre: 'Spinning',
    dias: 'Lunes / Miércoles / Viernes',
    hora: '6:00 - 7:00',
    entrenador: 'Luis Pérez',
  },
  {
    nombre: 'Funcional',
    dias: 'Martes / Jueves',
    hora: '7:00 - 8:00',
    entrenador: 'Andrea Morales',
  },
  {
    nombre: 'Yoga',
    dias: 'Lunes / Miércoles',
    hora: '18:00 - 19:00',
    entrenador: 'Karla Ramírez'
  },
  {
    nombre: 'Boxeo',
    dias: 'Martes / Jueves / Sábado',
    hora: '19:00 - 20:30',
    entrenador: 'Mario Cifuentes',
  },
  {
    nombre: 'GAP',
    dias: 'Sábado',
    hora: '9:00 - 10:00',
    entrenador: 'Andrea Morales'
  },
];
