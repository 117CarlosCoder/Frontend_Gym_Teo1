import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { PlanMembresia } from '../../../core/models/plan-membresia.model';
import { API, STORAGE_KEYS } from '../../../core/constants/api.constants';
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
    nombre: 'Plan Semestral',
    duracion: 180,
    precio: 1200.0,
    descripcion: 'Membresía semestral con acceso completo a todas las áreas e instalaciones.',
    beneficios: ['Pesas y máquinas', 'Cardio libre', 'Clases grupales', 'Evaluación física semestral'],
    activo: true,
  },
  {
    id_plan: 4,
    nombre: 'Plan Anual',
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
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  private readonly planesSubject = new BehaviorSubject<PlanMembresia[]>(this.cargarPlanesIniciales());
  readonly planes$ = this.planesSubject.asObservable();

  constructor() {
    this.sincronizarConBackend();
  }

  private sincronizarConBackend(): void {
    this.getPlanes().subscribe({
      error: () => {},
    });
  }

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

  private inferirBeneficios(nombre: string): string[] {
    const lower = (nombre || '').toLowerCase();
    if (lower.includes('anual')) {
      return ['Acceso total ilimitado 365 días', 'Clases grupales', 'Evaluaciones físicas trimestrales', '1 Pase de invitado al mes'];
    }
    if (lower.includes('semestral')) {
      return ['Pesas y máquinas', 'Cardio libre', 'Clases grupales', 'Evaluación semestral'];
    }
    if (lower.includes('trimestral')) {
      return ['Pesas y máquinas', 'Cardio libre', '1 Evaluación inicial', 'Casillero de día'];
    }
    return ['Pesas y máquinas', 'Cardio libre', 'Casillero de día'];
  }

  private mapearDtoAPlan(dto: any): PlanMembresia {
    return {
      id_plan: dto.id ?? dto.id_plan,
      nombre: dto.nombre,
      duracion: dto.duracion,
      precio: Number(dto.precio),
      descripcion: dto.descripcion || '',
      beneficios: dto.beneficios && dto.beneficios.length > 0 ? dto.beneficios : this.inferirBeneficios(dto.nombre),
      activo: true,
    };
  }

  /**
   * Obtiene la lista completa de planes llamando a GET /planes del backend.
   */
  getPlanes(): Observable<PlanMembresia[]> {
    return this.http.get<any[]>(API.planes).pipe(
      map((lista) => (Array.isArray(lista) ? lista.map((item) => this.mapearDtoAPlan(item)) : [])),
      tap((planes) => {
        if (planes.length > 0) {
          this.guardarEnStorage(planes);
        }
      }),
      catchError((error) => {
        console.warn('API /planes no disponible, utilizando almacenamiento local:', error);
        return of(this.planesSubject.getValue());
      })
    );
  }

  /**
   * Obtiene un plan por su ID llamando a GET /planes/{id}.
   */
  getPlanById(id: number): Observable<PlanMembresia | undefined> {
    return this.http.get<any>(`${API.planes}/${id}`).pipe(
      map((item) => this.mapearDtoAPlan(item)),
      catchError(() => {
        const local = this.planesSubject.getValue().find((p) => p.id_plan === id);
        return of(local);
      })
    );
  }

  /**
   * Crea un nuevo plan en el backend (POST /planes).
   */
  crearPlan(datos: Omit<PlanMembresia, 'id_plan'>): Observable<PlanMembresia> {
    const payload = {
      nombre: datos.nombre,
      duracion: datos.duracion,
      precio: datos.precio,
      descripcion: datos.descripcion,
    };

    return this.http.post<any>(API.planes, payload).pipe(
      map((res) => {
        const nuevo = this.mapearDtoAPlan(res);
        if (datos.beneficios) nuevo.beneficios = datos.beneficios;
        return nuevo;
      }),
      tap((nuevoPlan) => {
        const actuales = this.planesSubject.getValue();
        const actualizados = [...actuales.filter((p) => p.id_plan !== nuevoPlan.id_plan), nuevoPlan];
        this.guardarEnStorage(actualizados);
      }),
      catchError((error) => {
        // Si el backend responde error 400 (ej. duplicado), propagarlo
        if (error.status === 400 || error.status === 409) {
          return throwError(() => new Error(error.error?.message || 'Error al crear el plan en el servidor.'));
        }
        // Fallback local en caso de que backend esté desconectado (status 0)
        if (error.status === 0) {
          const planes = this.planesSubject.getValue();
          const maxId = planes.reduce((max, p) => Math.max(max, p.id_plan), 0);
          const nuevoLocal: PlanMembresia = {
            ...datos,
            id_plan: maxId + 1,
            activo: true,
            beneficios: datos.beneficios?.length ? datos.beneficios : this.inferirBeneficios(datos.nombre),
          };
          this.guardarEnStorage([...planes, nuevoLocal]);
          return of(nuevoLocal);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza un plan existente en el backend (PUT /planes/{id}).
   */
  actualizarPlan(id: number, cambios: Partial<PlanMembresia>): Observable<PlanMembresia> {
    const payload = {
      nombre: cambios.nombre,
      duracion: cambios.duracion,
      precio: cambios.precio,
      descripcion: cambios.descripcion,
    };

    return this.http.put<any>(`${API.planes}/${id}`, payload).pipe(
      map((res) => {
        const actualizado = this.mapearDtoAPlan(res);
        if (cambios.beneficios) actualizado.beneficios = cambios.beneficios;
        return actualizado;
      }),
      tap((actualizado) => {
        const actuales = this.planesSubject.getValue();
        const index = actuales.findIndex((p) => p.id_plan === id);
        if (index !== -1) {
          const nuevos = [...actuales];
          nuevos[index] = { ...nuevos[index], ...actualizado };
          this.guardarEnStorage(nuevos);
        }
      }),
      catchError((error) => {
        if (error.status === 0) {
          const actuales = this.planesSubject.getValue();
          const index = actuales.findIndex((p) => p.id_plan === id);
          if (index !== -1) {
            const nuevos = [...actuales];
            nuevos[index] = { ...nuevos[index], ...cambios };
            this.guardarEnStorage(nuevos);
            return of(nuevos[index]);
          }
        }
        return throwError(() => new Error(error.error?.message || 'Error al actualizar el plan.'));
      })
    );
  }

  /**
   * Elimina un plan en el backend (DELETE /planes/{id}).
   */
  eliminarPlan(id: number): Observable<boolean> {
    return this.http.delete<void>(`${API.planes}/${id}`).pipe(
      map(() => true),
      tap(() => {
        const actuales = this.planesSubject.getValue();
        this.guardarEnStorage(actuales.filter((p) => p.id_plan !== id));
      }),
      catchError((error) => {
        if (error.status === 0) {
          const actuales = this.planesSubject.getValue();
          this.guardarEnStorage(actuales.filter((p) => p.id_plan !== id));
          return of(true);
        }
        return throwError(() => new Error(error.error?.message || 'No se puede eliminar el plan porque tiene membresías asociadas.'));
      })
    );
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
