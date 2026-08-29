import { Injectable } from '@angular/core';

/**
 * Envoltorio de localStorage. Aísla el acceso al navegador para que los
 * servicios no rompan si el storage está bloqueado o no existe (SSR/pruebas).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private get disponible(): boolean {
    return typeof localStorage !== 'undefined';
  }

  obtener<T>(clave: string): T | null {
    if (!this.disponible) return null;
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? (JSON.parse(crudo) as T) : null;
    } catch {
      return null;
    }
  }

  guardar<T>(clave: string, valor: T): void {
    if (!this.disponible) return;
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      /* almacenamiento lleno o deshabilitado: se ignora */
    }
  }

  eliminar(clave: string): void {
    if (!this.disponible) return;
    localStorage.removeItem(clave);
  }
}
