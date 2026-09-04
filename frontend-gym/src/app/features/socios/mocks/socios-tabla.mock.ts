import { SocioTablaDTO } from "../models/socio-tabla-dto.model";

export const MOCK_SOCIOS_TABLA: SocioTablaDTO[] = [
    {
        id_socio: 10,
        usuario: {
            id: 10,
            dpi: '1010101010101',
            rol: 'SOCIO',
            nombre: 'Juan Carlos',
            apellido: 'Pérez Gómez',
            correo: 'juan.perez@example.com',
            telefono: '+502 5555-1234',
            username: 'juan.perez',
            activo: true,
            fecha_creacion: '2026-01-15T08:00:00Z',
            doble_autenticacion: false
        },
        socioInfo: {
            id_socio: 10,
            fecha_registro: '2026-01-15'
        },
        entrenadoresAsignados: [
            { idEntrenador: 101, nombre: 'Carlos', apellido: 'Mendoza', especialidad: 'Entrenamiento Funcional' }
        ],
        clasesAsignadas: [
            { idClase: 50, idEntrenador: 101, nombreEntrenador: 'Carlos Mendoza', nombre: 'Crossfit Avanzado', horario: '2026-08-30T07:00:00' }
        ],
        ultimaMedicion: {
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
        estadoMembresia: 'Activa',
        tipoPlan: 'Premium'
    },
    {
        id_socio: 11,
        usuario: {
            id: 11,
            dpi: '1111111111111',
            rol: 'SOCIO',
            nombre: 'María Antonieta',
            apellido: 'Díaz López',
            correo: 'maria.diaz@example.com',
            telefono: '+502 4444-5678',
            username: 'maria.diaz',
            activo: true,
            fecha_creacion: '2026-03-10T10:30:00Z',
            doble_autenticacion: true
        },
        socioInfo: {
            id_socio: 11,
            fecha_registro: '2026-03-10'
        },
        entrenadoresAsignados: [
            { idEntrenador: 102, nombre: 'Ana', apellido: 'Martínez', especialidad: 'Yoga' }
        ],
        clasesAsignadas: [
            { idClase: 51, idEntrenador: 102, nombreEntrenador: 'Ana Martínez', nombre: 'Spinning Matutino', horario: '2026-08-30T08:00:00' }
        ],
        ultimaMedicion: {
            id_medicion: 2,
            id_socio: 11,
            fecha: '2026-08-15',
            peso: 62.10,
            estatura: 1.63,
            porcentaje_grasa: 21.50,
            masa_muscular: 24.30
        },
        estadoMembresia: 'Vencida',
        tipoPlan: 'Básico'
    }
];