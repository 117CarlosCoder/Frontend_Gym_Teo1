import { Injectable } from '@angular/core';
import { SocioTablaDTO } from '../models/socio-tabla-dto.model';
import { Observable } from 'rxjs/internal/Observable';
import { MOCK_SOCIOS_TABLA } from '../mocks/socios.mock';
import { delay, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SociosService {

  getSocios(): Observable<SocioTablaDTO[]> {
    return of(MOCK_SOCIOS_TABLA).pipe(delay(800));  //Simula un retraso de red de 800ms
  }

}
