/** Modelos para los endpoints de /reportes del backend (Sprint 5) */

export interface IngresoMensual {
  mes: number;
  nombreMes?: string;
  anio?: number;
  total: number;
  transacciones?: number;
  cantidadPagos?: number;
}

export interface IngresoMetodoPago {
  metodoPago: string;
  total: number;
  transacciones?: number;
  cantidad?: number;
  porcentaje: number;
}

export interface PagoDetalleReporte {
  idComprobante?: number;
  comprobanteId?: number;
  fechaPago: string;
  nombreSocio: string;
  nombrePlan: string;
  metodoPago: string;
  monto: number;
  referencia: string | null;
  recepcionista?: string;
  nombreRecepcionista?: string;
}

export interface ReporteIngresos {
  anio?: number | null;
  anioConsultado?: number | null;
  ingresoTotal: number;
  totalPeriodo?: number;
  totalTransacciones: number;
  cantidadPagosPeriodo?: number;
  ingresoPromedioMensual?: number;
  mesMayorIngreso?: string;
  montoMayorIngreso?: number;
  ingresosPorMes: IngresoMensual[];
  ingresosPorMetodoPago: IngresoMetodoPago[];
  pagosDetalle: PagoDetalleReporte[];
  ultimosPagos?: PagoDetalleReporte[];
}

export interface DistribucionSucursal {
  sucursalId: number;
  nombreSucursal: string;
  activos: number;
  morosos: number;
  total: number;
}

export interface MiembroEstadoDetalle {
  socioId: number;
  nombres: string;
  apellidos: string;
  correo: string;
  dpi: string;
  estadoSocio: 'ACTIVO' | 'MOROSO' | 'INACTIVO' | string;
  planActual: string | null;
  fechaFinMembresia: string | null;
  diasMora: number;
  saldoPendiente: number;
  sucursal: string | null;
}

export interface ReporteMiembrosEstado {
  fechaCorte: string;
  totalSocios: number;
  activos: number;
  morosos: number;
  inactivos: number;
  porcentajeActivos: number;
  porcentajeMorosos: number;
  distribucionPorSucursal: DistribucionSucursal[];
  miembros: MiembroEstadoDetalle[];
}

export interface RenovacionMes {
  mes: number;
  anio?: number;
  nombreMes?: string;
  renovaciones: number;
  nuevas?: number;
  total?: number;
  tasaRetencion?: number;
  tasaRenovacion?: number;
}

export interface RenovacionDetalle {
  idMembresia?: number;
  membresiaId?: number;
  idSocio?: number;
  socioId?: number;
  nombreSocio: string;
  planRenovado: string;
  fechaRenovacion: string;
  nuevaFechaVencimiento: string;
}

export interface ReporteRenovaciones {
  anio?: number | null;
  anioConsultado?: number | null;
  totalRenovaciones: number;
  totalMembresiasPeriodo?: number;
  nuevasMembresias?: number;
  tasaRetencionPromedio: number;
  tasaRenovacionGlobal?: number;
  proximasAVencerSiguienteSemana?: number;
  renovacionesPorMes: RenovacionMes[];
  detalles: RenovacionDetalle[];
  ultimasRenovaciones?: RenovacionDetalle[];
}

export interface DiaSemanaAsistencia {
  numeroDia?: number;
  nombreDia?: string;
  diaSemana: string;
  totalAsistencias: number;
  cantidad?: number;
  porcentaje: number;
}

export interface HoraPico {
  hora?: number;
  etiquetaHora?: string;
  franjaHoraria: string;
  totalAsistencias: number;
  cantidad?: number;
  porcentaje: number;
}

export interface TopSocioAsistencia {
  socioId: number;
  nombreSocio: string;
  nombreCompleto?: string;
  totalVisitas: number;
  asistencias?: number;
}

export interface SucursalAsistencia {
  sucursalId: number;
  nombreSucursal: string;
  totalAsistencias: number;
  cantidad?: number;
}

export interface MetricaAsistencia {
  totalAsistenciasPeriodo: number;
  asistenciasMesActual?: number;
  asistenciasSemanaActual?: number;
  asistenciasHoy?: number;
  promedioDiario: number;
  promedioDiarioMes?: number;
  diaMayorAfluencia: string;
  horaPico: string;
  horasPico?: HoraPico[];
  distribucionHorasPico: HoraPico[];
  asistenciasPorDiaSemana: DiaSemanaAsistencia[];
  topSociosAsistencia: TopSocioAsistencia[];
  asistenciasPorSucursal: SucursalAsistencia[];
}

export interface MembresiaPorVencer {
  idMembresia: number;
  idSocio: number;
  nombreSocio: string;
  correoSocio: string;
  nombrePlan: string;
  fechaVencimiento: string;
  diasRestantes: number;
}

export interface DistribucionPlan {
  planId: number;
  nombrePlan: string;
  cantidadSocios: number;
  porcentaje: number;
}

export interface VisitasMes {
  etiqueta: string;
  visitas: number;
}

export interface DashboardResumen {
  totalSocios: number;
  totalSociosActivos: number;
  totalSociosMorosos: number;
  totalSociosInactivos: number;
  porcentajeActivos: number;
  porcentajeMorosos: number;
  ingresosMesActual: number;
  asistenciasHoy: number;
  membresiasPorVencer: MembresiaPorVencer[];
  topPlanes: DistribucionPlan[];
  asistenciasUltimos7Dias: VisitasMes[];
  ingresosUltimos6Meses: IngresoMensual[];
}
