import { SocioPortalDTO } from "../models/socio-portal-dto.model";

export const MOCK_SOCIO_PORTAL: SocioPortalDTO = {
    usuario: {
        id: 3,
        dpi: '3333333333333',
        nombre: 'Brandon',
        apellido: 'Cotom',
        correo: 'socio@claudelovers.com',
        rol: 'SOCIO',
        activo: true,
        fecha_creacion: '2026-01-15T08:00:00Z',
        doble_autenticacion: false,
        username: 'brandon.cotom'
    },
    entrenadoresAsignados: [
        {
            idEntrenador: 2,
            nombre: 'Luis',
            apellido: 'Perez',
            especialidad: 'Fuerza e hipertrofia'
        },
        {
            idEntrenador: 3,
            nombre: 'Karla',
            apellido: 'Ramirez',
            especialidad: 'Yoga y movilidad',
        },
    ],
    clasesAsignadas: [
        {
            idClase: 101,
            idEntrenador: 2,
            nombreEntrenador: 'Luis Perez',
            nombre: 'Spinning',
            horario: 'Lun / Mié / Viernes 6:00-7:00'
        },
        {
            idClase: 102,
            idEntrenador: 3,
            nombreEntrenador: 'Karla Ramirez',
            nombre: 'Yoga',
            horario: 'Lunes y Miercoles 18:00-19:00'
        },
    ],
    medicion: {
        id_medicion: 1,
        id_socio: 10,
        fecha: '2026-08-20',
        peso: 78.50,
        estatura: 1.75,
        porcentaje_grasa: 14.20,
        masa_muscular: 38.10,
        cintura: 82.00,
        brazo: 35.50,
        pierna: 55.00,
        observaciones: 'Progreso excelente en masa muscular.'
    },
    membresia: {
        idMembresia: 1,
        fechaInicio: '2026-08-01',
        fechaVencimiento: '2026-09-01',
        estado: 'Activa',
        descripcionEstado: 'Membresía vigente y con acceso habilitado',
        tipo: 'Premium',
        precio: 400.00,
        duracionDias: 30,
        descripcion: 'Acompañamiento completo con entrenador y nutrición.',
        beneficios: [
            'Todo lo del plan Full',
            'Entrenador personal asignado',
            'Plan nutricional mensual',
            'Rutina personalizada',
            'Invitado gratis una vez al mes',
        ]
    },
    asistencias: [
        { idSocio: 3, idClase: 101, fecha: '2026-08-30', horaEntrada: '06:00', horaSalida: '07:00' },
        { idSocio: 3, idClase: 101, fecha: '2026-09-01', horaEntrada: '06:00', horaSalida: null }
    ]
};