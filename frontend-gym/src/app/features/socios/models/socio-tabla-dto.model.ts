import { MedicionFisica } from "./medicion-fisica.model";
import { Socio } from "./socio.model";
import { Usuario } from "../../../core/models/usuario.model";
import { ClaseInscrita } from "./clase-inscrita.model";
import { EntrenadorAsignado } from "./entrenador-asignado.model";

export interface SocioTablaDTO {
    id_socio: number;
    usuario: Usuario;
    socioInfo: Socio;
    entrenadoresAsignados: EntrenadorAsignado[];
    clasesAsignadas: ClaseInscrita[];
    ultimaMedicion?: MedicionFisica; // Puede no tener mediciones aún
    estadoMembresia: string;
    tipoPlan: string;
}
