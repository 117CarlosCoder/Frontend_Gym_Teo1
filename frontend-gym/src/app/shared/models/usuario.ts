export interface Usuario {
    id_usuario: number;
    id_rol: number;
    nombres: string;
    apellidos: string;
    correo: string;
    telefono?: string;
    username: string;
    activo: boolean;
    fecha_creacion: string | Date;
    doble_autenticacion: boolean;
}
