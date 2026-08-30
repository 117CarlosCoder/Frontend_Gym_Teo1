import { MedicionFisica } from "../../../shared/models/medicion-fisica.model";
import { Socio } from "../../../shared/models/socio.model";
import { Usuario } from "../../../shared/models/usuario.model";
import { ClaseInscrita } from "./clase-inscrita.model";
import { EntrenadorAsignado } from "./entrenador-asignado.model";

export interface SocioTablaDTO {
    id_socio: number;
    usuario: Omit<Usuario, 'password'>; // Incluye password
    socioInfo: Socio;
    entrenadoresAsignados: EntrenadorAsignado[];
    clasesAsignadas: ClaseInscrita[];
    ultimaMedicion?: MedicionFisica; // Puede no tener mediciones aún
    estadoMembresia: string;
    tipoPlan: string;
}
