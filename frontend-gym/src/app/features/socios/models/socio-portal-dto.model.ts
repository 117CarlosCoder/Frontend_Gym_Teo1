import { AsistenciaClase, Clase, Entrenador, MembresiaSocio } from "../../../core/models/gimnasio.model";
import { Usuario } from "../../../core/models/usuario.model";
import { MedicionFisica } from "./medicion-fisica.model";

export interface SocioPortalDTO {
    usuario: Usuario;
    entrenadoresAsignados: Entrenador[];
    clasesAsignadas: Clase[];
    medicion: MedicionFisica;
    membresia: MembresiaSocio;
    asistencias: AsistenciaClase[];
}
