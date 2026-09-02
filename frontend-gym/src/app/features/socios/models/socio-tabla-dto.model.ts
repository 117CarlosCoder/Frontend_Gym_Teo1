import { MedicionFisica } from "./medicion-fisica.model";
import { Socio } from "./socio.model";
import { Usuario } from "./usuario.model";
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
