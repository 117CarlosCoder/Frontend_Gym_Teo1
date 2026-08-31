import { SocioTablaDTO } from "../models/socio-tabla-dto.model";

export const MOCK_SOCIOS_TABLA: SocioTablaDTO[] = [
    {
        id_socio: 1,
        usuario: {
            id_usuario: 10,
            id_rol: 2,
            nombres: 'Juan Carlos',
            apellidos: 'Pérez Gómez',
            correo: 'juan.perez@example.com',
            telefono: '+502 5555-1234',
            username: 'juan.perez',
            activo: true,
            fecha_creacion: '2026-01-15T08:00:00Z',
            doble_autenticacion: false
        },
        socioInfo: {
            id_socio: 1,
            fecha_registro: '2026-01-15'
        },
        entrenadoresAsignados: [
            { id_entrenador: 101, nombres: 'Carlos', apellidos: 'Mendoza' }
        ],
        clasesAsignadas: [
            { id_clase: 50, nombre_clase: 'Crossfit Avanzado', horario: '2026-08-30T07:00:00' }
        ],
        ultimaMedicion: {
            id_medicion: 1,
            id_socio: 1,
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
        estadoMembresia: 'Activo',
        tipoPlan: 'Premium Anual'
    },
    {
        id_socio: 2,
        usuario: {
            id_usuario: 11,
            id_rol: 2,
            nombres: 'María Antonieta',
            apellidos: 'Díaz López',
            correo: 'maria.diaz@example.com',
            telefono: '+502 4444-5678',
            username: 'maria.diaz',
            activo: true,
            fecha_creacion: '2026-03-10T10:30:00Z',
            doble_autenticacion: true
        },
        socioInfo: {
            id_socio: 2,
            fecha_registro: '2026-03-10'
        },
        entrenadoresAsignados: [
            { id_entrenador: 102, nombres: 'Ana', apellidos: 'Martínez' }
        ],
        clasesAsignadas: [
            { id_clase: 51, nombre_clase: 'Spinning Matutino', horario: '2026-08-30T08:00:00' }
        ],
        ultimaMedicion: {
            id_medicion: 2,
            id_socio: 2,
            fecha: '2026-08-15',
            peso: 62.10,
            estatura: 1.63,
            porcentaje_grasa: 21.50,
            masa_muscular: 24.30
        },
        estadoMembresia: 'Pendiente de Pago',
        tipoPlan: 'Mensual Básico'
    }
];