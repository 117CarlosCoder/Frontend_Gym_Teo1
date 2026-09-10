import { SocioTablaDTO } from "../models/socio-tabla-dto.model";

export const MOCK_SOCIOS_TABLA: SocioTablaDTO[] = [
    {
        id_socio: 4,
        usuario: {
            id: 4,
            dpi: '1000000000004',
            rol: 'CLIENTE',
            nombre: 'Carlos Raúl',
            apellido: 'López (Socio)',
            correo: 'carloslopez202031871@cunoc.edu.gt',
            telefono: '55550004',
            username: 'carlos202031871',
            activo: true,
            fecha_creacion: '2024-03-01T08:00:00Z',
            doble_autenticacion: false
        },
        socioInfo: {
            id_socio: 4,
            fecha_registro: '2024-03-01'
        },
        entrenadoresAsignados: [
            { idEntrenador: 3, nombre: 'Carlos', apellido: 'López (Coach)', especialidad: 'Fuerza e Hipertrofia' }
        ],
        clasesAsignadas: [
            { idClase: 1, idEntrenador: 3, nombreEntrenador: 'Carlos Coach', nombre: 'CrossFit Intensivo', horario: '2026-08-30T07:00:00' }
        ],
        ultimaMedicion: {
            id_medicion: 1,
            id_socio: 4,
            fecha: '2026-08-20',
            peso: 76.50,
            estatura: 1.74,
            porcentaje_grasa: 14.50,
            masa_muscular: 38.00,
            cintura: 80.00,
            brazo: 36.00,
            pierna: 56.00,
            observaciones: 'Excelente rendimiento y constancia.'
        },
        estado: 'ACTIVO',
        estadoMembresia: 'Activa',
        tipoPlan: 'Plan Anual',
        id_plan: 3,
        fechaInicioMembresia: '2026-01-01',
        fechaVencimientoMembresia: '2026-12-31'
    },
    {
        id_socio: 8,
        usuario: {
            id: 8,
            dpi: '1000000000008',
            rol: 'CLIENTE',
            nombre: 'Lucía Elena',
            apellido: 'Hernández Ruiz',
            correo: 'lucia.hernandez@gymdemo.com',
            telefono: '55550008',
            username: 'lhernandez',
            activo: true,
            fecha_creacion: '2024-04-01T08:00:00Z',
            doble_autenticacion: false
        },
        socioInfo: {
            id_socio: 8,
            fecha_registro: '2024-04-01'
        },
        entrenadoresAsignados: [
            { idEntrenador: 6, nombre: 'Alejandro', apellido: 'García', especialidad: 'Spinning & Cardio' }
        ],
        clasesAsignadas: [
            { idClase: 2, idEntrenador: 6, nombreEntrenador: 'Alejandro García', nombre: 'Spinning Matutino', horario: '2026-08-30T08:00:00' }
        ],
        ultimaMedicion: {
            id_medicion: 2,
            id_socio: 8,
            fecha: '2026-08-15',
            peso: 59.20,
            estatura: 1.64,
            porcentaje_grasa: 20.10,
            masa_muscular: 26.30
        },
        estado: 'ACTIVO',
        estadoMembresia: 'Activa',
        tipoPlan: 'Plan Trimestral',
        id_plan: 2,
        fechaInicioMembresia: '2026-06-01',
        fechaVencimientoMembresia: '2026-08-30'
    },
    {
        id_socio: 9,
        usuario: {
            id: 9,
            dpi: '1000000000009',
            rol: 'CLIENTE',
            nombre: 'Diego Andrés',
            apellido: 'Pineda Estrada',
            correo: 'diego.pineda@gymdemo.com',
            telefono: '55550009',
            username: 'dpineda',
            activo: false,
            fecha_creacion: '2024-04-10T08:00:00Z',
            doble_autenticacion: false
        },
        socioInfo: {
            id_socio: 9,
            fecha_registro: '2024-04-10'
        },
        entrenadoresAsignados: [],
        clasesAsignadas: [],
        estado: 'MOROSO',
        estadoMembresia: 'Vencida',
        tipoPlan: 'Plan Mensual',
        id_plan: 1,
        fechaInicioMembresia: '2026-07-01',
        fechaVencimientoMembresia: '2026-07-31'
    },
    {
        id_socio: 10,
        usuario: {
            id: 10,
            dpi: '1000000000010',
            rol: 'CLIENTE',
            nombre: 'Valeria Sofía',
            apellido: 'Méndez Alvarado',
            correo: 'valeria.mendez@gymdemo.com',
            telefono: '55550010',
            username: 'vmendez',
            activo: false,
            fecha_creacion: '2024-05-01T08:00:00Z',
            doble_autenticacion: false
        },
        socioInfo: {
            id_socio: 10,
            fecha_registro: '2024-05-01'
        },
        entrenadoresAsignados: [],
        clasesAsignadas: [],
        estado: 'INACTIVO',
        estadoMembresia: 'Cancelada',
        tipoPlan: 'Sin Membresía'
    }
];