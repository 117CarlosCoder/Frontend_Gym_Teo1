export interface MedicionFisica {
    id_medicion: number;
    id_socio: number;
    fecha: string | Date;
    peso?: number;
    estatura?: number;
    porcentaje_grasa?: number;
    masa_muscular?: number;
    cintura?: number;
    brazo?: number;
    pierna?: number;
    observaciones?: string;
}
