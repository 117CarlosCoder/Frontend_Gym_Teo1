import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { AsistenciaRegistro, RegistrarAsistenciaRequest, SocioAsistencia } from '../models/asistencia.model';
import { MOCK_ASISTENCIAS_HOY, MOCK_SOCIOS_ASISTENCIA, MOCK_SUCURSALES } from '../mocks/asistencia.mock';
import { Sucursal } from '../../../core/models/sucursal.model';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  
  private asistencias: AsistenciaRegistro[] = [...MOCK_ASISTENCIAS_HOY];
  private currentId = 6;

  getSucursales(): Observable<Sucursal[]> {
    return of(MOCK_SUCURSALES).pipe(delay(500));
  }

  getAsistenciasHoy(idSucursal: number): Observable<AsistenciaRegistro[]> {
    const sucursal = MOCK_SUCURSALES.find(s => s.idSucursal === idSucursal);
    if (!sucursal) return of([]).pipe(delay(800));
    
    const filtradas = this.asistencias.filter(a => a.sucursal === sucursal.nombre);
    return of(filtradas).pipe(delay(800));
  }

  getSociosParaAsistencia(): Observable<SocioAsistencia[]> {
    return of(MOCK_SOCIOS_ASISTENCIA).pipe(delay(600));
  }

  registrarEntrada(request: RegistrarAsistenciaRequest): Observable<AsistenciaRegistro> {
    const socio = MOCK_SOCIOS_ASISTENCIA.find(s => s.idSocio === request.idSocio);
    const sucursal = MOCK_SUCURSALES.find(s => s.idSucursal === request.idSucursal);
    
    const now = new Date();
    const nueva: AsistenciaRegistro = {
      idAsistencia: this.currentId++,
      idSocio: request.idSocio,
      nombreSocio: socio ? socio.nombre : 'Desconocido',
      apellidoSocio: socio ? socio.apellido : '',
      sucursal: sucursal ? sucursal.nombre : 'Desconocida',
      fecha: now.toISOString().split('T')[0],
      horaEntrada: now.toTimeString().split(' ')[0],
      horaSalida: null,
      registradoPor: 'Admin'
    };
    
    this.asistencias.push(nueva);
    return of(nueva).pipe(delay(400));
  }

  registrarSalida(idAsistencia: number): Observable<AsistenciaRegistro> {
    const registro = this.asistencias.find(a => a.idAsistencia === idAsistencia);
    if (registro) {
      const now = new Date();
      registro.horaSalida = now.toTimeString().split(' ')[0];
      return of({...registro}).pipe(delay(400));
    }
    throw new Error('Asistencia no encontrada');
  }
}
