import { MedicionFisica } from "../../../shared/models/medicion-fisica";
import { Socio } from "../../../shared/models/socio";
import { Usuario } from "../../../shared/models/usuario";
import { ClaseInscrita } from "./clase-inscrita";
import { EntrenadorAsignado } from "./entrenador-asignado";

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
