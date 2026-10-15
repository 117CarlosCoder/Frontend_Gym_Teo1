/** Modelos para los endpoints de /reportes del backend (Sprint 5) */

export interface IngresoMensual {
  mes: number;
  nombreMes?: string;
  anio: number;
  total: number;
  transacciones: number;
}

export interface IngresoMetodoPago {
  metodoPago: string;
  total: number;
  transacciones: number;
  porcentaje: number;
}

export interface PagoDetalleReporte {
  idComprobante: number;
  fechaPago: string;
  nombreSocio: string;
  nombrePlan: string;
  metodoPago: string;
  monto: number;
  referencia: string | null;
  recepcionista: string;
}

export interface ReporteIngresos {
  anioConsultado: number | null;
  ingresoTotal: number;
  totalTransacciones: number;
  ingresosPorMes: IngresoMensual[];
  ingresosPorMetodoPago: IngresoMetodoPago[];
  pagosDetalle: PagoDetalleReporte[];
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
  anio: number;
  renovaciones: number;
  tasaRetencion: number;
}

export interface RenovacionDetalle {
  idMembresia: number;
  idSocio: number;
  nombreSocio: string;
  planRenovado: string;
  fechaRenovacion: string;
  nuevaFechaVencimiento: string;
}

export interface ReporteRenovaciones {
  anioConsultado: number | null;
  totalRenovaciones: number;
  tasaRetencionPromedio: number;
  renovacionesPorMes: RenovacionMes[];
  detalles: RenovacionDetalle[];
}

export interface DiaSemanaAsistencia {
  diaSemana: string;
  totalAsistencias: number;
  porcentaje: number;
}

export interface HoraPico {
  franjaHoraria: string;
  totalAsistencias: number;
  porcentaje: number;
}

export interface TopSocioAsistencia {
  socioId: number;
  nombreSocio: string;
  totalVisitas: number;
}

export interface SucursalAsistencia {
  sucursalId: number;
  nombreSucursal: string;
  totalAsistencias: number;
}

export interface MetricaAsistencia {
  totalAsistenciasPeriodo: number;
  promedioDiario: number;
  diaMayorAfluencia: string;
  horaPico: string;
  asistenciasPorDiaSemana: DiaSemanaAsistencia[];
  distribucionHorasPico: HoraPico[];
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
