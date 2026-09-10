import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, delay, of, throwError } from 'rxjs';
import { PlanMembresia } from '../../../core/models/plan-membresia.model';
import { STORAGE_KEYS } from '../../../core/constants/api.constants';
import { StorageService } from '../../../core/services/storage.service';

export const PLANES_BASE: PlanMembresia[] = [
  {
    id_plan: 1,
    nombre: 'Plan Mensual',
    duracion: 30,
    precio: 250.0,
    descripcion: 'Acceso total a área de pesas, cardio y vestidores durante 30 días continuos.',
    beneficios: ['Pesas y máquinas', 'Cardio libre', 'Casillero de día'],
    activo: true,
  },
  {
    id_plan: 2,
    nombre: 'Plan Trimestral',
    duracion: 90,
    precio: 650.0,
    descripcion: 'Paquete de 3 meses de entrenamiento continuo con ahorro preferencial.',
    beneficios: ['Pesas y máquinas', 'Cardio libre', '1 Evaluación física inicial', 'Casillero de día'],
    activo: true,
  },
  {
    id_plan: 3,
    nombre: 'Plan Anual VIP',
    duracion: 365,
    precio: 2200.0,
    descripcion: 'Membresía anual completa con acceso ilimitado a todas las instalaciones.',
    beneficios: [
      'Acceso total ilimitado 365 días',
      'Acceso a clases grupales',
      'Evaluaciones físicas trimestrales',
      '1 Pase de invitado al mes',
    ],
    activo: true,
  },
];

@Injectable({
  providedIn: 'root',
})
export class PlanesService {
  private readonly storage = inject(StorageService);

  private readonly planesSubject = new BehaviorSubject<PlanMembresia[]>(this.cargarPlanesIniciales());
  readonly planes$ = this.planesSubject.asObservable();

  private cargarPlanesIniciales(): PlanMembresia[] {
    const guardados = this.storage.obtener<PlanMembresia[]>(STORAGE_KEYS.planes);
    if (guardados && Array.isArray(guardados) && guardados.length > 0) {
      return guardados;
    }
    this.storage.guardar(STORAGE_KEYS.planes, PLANES_BASE);
    return [...PLANES_BASE];
  }

  private guardarEnStorage(planes: PlanMembresia[]): void {
    this.storage.guardar(STORAGE_KEYS.planes, planes);
    this.planesSubject.next(planes);
  }

  getPlanes(): Observable<PlanMembresia[]> {
    return of(this.planesSubject.getValue()).pipe(delay(200));
  }

  getPlanById(id: number): Observable<PlanMembresia | undefined> {
    const plan = this.planesSubject.getValue().find((p) => p.id_plan === id);
    return of(plan).pipe(delay(100));
  }

  crearPlan(datos: Omit<PlanMembresia, 'id_plan'>): Observable<PlanMembresia> {
    const planes = this.planesSubject.getValue();
    const existeNombre = planes.some(
      (p) => p.nombre.toLowerCase().trim() === datos.nombre.toLowerCase().trim()
    );
    if (existeNombre) {
      return throwError(() => new Error('Ya existe un plan con este nombre.'));
    }

    const maxId = planes.reduce((max, p) => Math.max(max, p.id_plan), 0);
    const nuevoPlan: PlanMembresia = {
      ...datos,
      id_plan: maxId + 1,
      activo: true,
      beneficios: datos.beneficios?.length ? datos.beneficios : ['Acceso general'],
    };

    const nuevos = [...planes, nuevoPlan];
    this.guardarEnStorage(nuevos);
    return of(nuevoPlan).pipe(delay(300));
  }

  actualizarPlan(id: number, cambios: Partial<PlanMembresia>): Observable<PlanMembresia> {
    const planes = this.planesSubject.getValue();
    const indice = planes.findIndex((p) => p.id_plan === id);
    if (indice === -1) {
      return throwError(() => new Error('Plan no encontrado.'));
    }

    const actualizado: PlanMembresia = {
      ...planes[indice],
      ...cambios,
    };

    const nuevos = [...planes];
    nuevos[indice] = actualizado;
    this.guardarEnStorage(nuevos);
    return of(actualizado).pipe(delay(300));
  }

  eliminarPlan(id: number): Observable<boolean> {
    const planes = this.planesSubject.getValue();
    const filtrados = planes.filter((p) => p.id_plan !== id);
    if (filtrados.length === planes.length) {
      return throwError(() => new Error('Plan no encontrado para eliminar.'));
    }
    this.guardarEnStorage(filtrados);
    return of(true).pipe(delay(250));
  }

  /**
   * Calcula la fecha de vencimiento sumando la duración en días a una fecha de inicio (formato YYYY-MM-DD).
   */
  calcularFechaVencimiento(fechaInicioStr: string, duracionDias: number): string {
    const fecha = new Date(fechaInicioStr);
    if (isNaN(fecha.getTime())) {
      const hoy = new Date();
      hoy.setDate(hoy.getDate() + duracionDias);
      return hoy.toISOString().split('T')[0];
    }
    fecha.setDate(fecha.getDate() + duracionDias);
    return fecha.toISOString().split('T')[0];
  }
}

