import { Injectable } from '@angular/core';
import { SocioTablaDTO } from '../models/socio-tabla-dto.model';
import { Observable } from 'rxjs/internal/Observable';
import { MOCK_SOCIOS_TABLA } from '../mocks/socios-tabla.mock';
import { delay, of } from 'rxjs';
import { SocioPortalDTO } from '../models/socio-portal-dto.model';
import { MOCK_SOCIO_PORTAL } from '../mocks/socio-portal.mock';

@Injectable({
  providedIn: 'root',
})
export class SociosService {

  getSocios(): Observable<SocioTablaDTO[]> {
    return of(MOCK_SOCIOS_TABLA).pipe(delay(800));  //Simula un retraso de red de 800ms
  }

  getSocio(): Observable<SocioPortalDTO> {
    return of(MOCK_SOCIO_PORTAL).pipe(delay(800));
  }

}
