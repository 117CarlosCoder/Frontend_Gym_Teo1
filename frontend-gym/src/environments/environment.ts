/**
 * Entorno de desarrollo.
 * Mientras el backend (Spring Boot 4) no esté levantado, `useMockAuth` permite
 * trabajar el front con usuarios simulados. Al conectar la API, poner `false`.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  useMockAuth: true,
  appName: 'Claude Lovers Gym',
};
