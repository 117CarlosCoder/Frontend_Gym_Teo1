import { MedicionFisica } from "./medicion-fisica.model";
import { SocioDB } from "./socio-db.model";
import { Usuario } from "../../../core/models/usuario.model";
import { Clase, Entrenador } from "../../../core/models/gimnasio.model";

export interface SocioTablaDTO {
    id_socio: number;
    usuario: Usuario;
    socioInfo: SocioDB;
    entrenadoresAsignados: Entrenador[];
    clasesAsignadas: Clase[];
    ultimaMedicion?: MedicionFisica; // Puede no tener mediciones aún
    estadoMembresia: string;
    tipoPlan: string;
}
