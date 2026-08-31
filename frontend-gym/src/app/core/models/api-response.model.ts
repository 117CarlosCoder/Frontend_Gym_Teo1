export interface ApiResponse<T> {
  data: T;
  mensaje?: string;
  exito: boolean;
}

export interface PaginaApi<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  total: number;
}
