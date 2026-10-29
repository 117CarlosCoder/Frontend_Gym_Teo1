import { Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import Highcharts from 'highcharts/esm/highcharts.js';
import 'highcharts/esm/modules/accessibility.js';

/** Paleta y tipografía del gimnasio aplicadas a todos los gráficos. */
const TEMA: Highcharts.Options = {
  colors: ['#035e7b', '#101d42', '#1e7d55', '#b7791f', '#b3261e', '#0a7fa3', '#6e6a6f'],
  chart: {
    backgroundColor: 'transparent',
    style: { fontFamily: 'Arial, Helvetica, sans-serif' },
  },
  title: { text: undefined },
  credits: { enabled: false },
  lang: {
    decimalPoint: '.',
    thousandsSep: ',',
    noData: 'Sin datos para mostrar',
  },
  legend: { itemStyle: { fontWeight: '600', color: '#4a4a4a' } },
  xAxis: { labels: { style: { color: '#4a4a4a' } } },
  yAxis: { labels: { style: { color: '#4a4a4a' } }, gridLineColor: '#e2e6ee' },
};

/**
 * Envoltorio de Highcharts. Recibe las opciones del gráfico y lo vuelve a dibujar
 * cada vez que cambian; se destruye junto con el componente.
 */
@Component({
  selector: 'app-grafico',
  template: `<div #contenedor class="grafico" [style.height.px]="alto()" role="img" [attr.aria-label]="descripcion()"></div>`,
  styles: `
    :host { display: block; }
    .grafico { width: 100%; }
  `,
})
export class GraficoComponent implements OnDestroy {
  readonly opciones = input.required<Highcharts.Options>();
  readonly alto = input<number>(300);
  /** Texto alternativo del gráfico para lectores de pantalla. */
  readonly descripcion = input<string>('');

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');
  private grafico: Highcharts.Chart | null = null;

  constructor() {
    effect(() => {
      const opciones = Highcharts.merge(TEMA, this.opciones());
      const elemento = this.contenedor().nativeElement;
      if (this.grafico) {
        this.grafico.update(opciones, true, true);
      } else {
        this.grafico = Highcharts.chart(elemento, opciones);
      }
    });
  }

  ngOnDestroy(): void {
    this.grafico?.destroy();
    this.grafico = null;
  }
}
