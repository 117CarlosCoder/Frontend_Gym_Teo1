import { MedicionFisica } from "./medicion-fisica.model";
import { SocioDB } from "./socio-db.model";
import { Usuario } from "../../../core/models/usuario.model";
import { Clase, Entrenador } from "../../../core/models/gimnasio.model";

export type EstadoSocio = 'ACTIVO' | 'INACTIVO' | 'MOROSO';

export interface SocioTablaDTO {
    id_socio: number;
    usuario: Usuario;
    socioInfo: SocioDB;
    entrenadoresAsignados: Entrenador[];
    clasesAsignadas: Clase[];
    ultimaMedicion?: MedicionFisica; // Puede no tener mediciones aún
    estado: EstadoSocio;             // ACTIVO, INACTIVO, MOROSO (requerido por rúbrica)
    estadoMembresia: string;         // 'Activa', 'Vencida', 'Congelada', 'Sin Membresía'
    tipoPlan: string;                // 'Mensual', 'Trimestral', 'Anual', etc.
    id_plan?: number;
    fechaInicioMembresia?: string;
    fechaVencimientoMembresia?: string;
}

