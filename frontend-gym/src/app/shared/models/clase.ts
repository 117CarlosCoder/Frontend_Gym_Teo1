export interface Clase {
    id_clase: number;
    id_tipo_clase: number;
    id_entrenador: number;
    id_estado_clase: number;
    horario: string | Date;
    duracion: number;
    cupo_maximo: number;
}
