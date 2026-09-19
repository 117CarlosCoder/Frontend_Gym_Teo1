# Frontend — Proyecto 1 Gimnasio
## Teoría de Sistemas 1 · Segundo Semestre 2026

Aplicación web desarrollada en **Angular 21** para el sistema de administración y control de membresías de gimnasio, integrada con backend Spring Boot 4 y base de datos MariaDB 11.

---

## Stack Tecnológico
- **Framework:** Angular 21 (Standalone Components, Signals)
- **Servidor Web Producción:** Nginx Alpine (Multi-stage build)
- **Estilos:** CSS3 nativo + Bootstrap 5
- **Pruebas:** Vitest

---

## Despliegue con Docker Compose (Frontend + Backend + Base de Datos)

El proyecto incluye orquestación completa para levantar todo el sistema con **un solo comando**:

### 1. Levantar todos los servicios:
```bash
docker compose up --build
```
> O si ejecutas en segundo plano:
> ```bash
> docker compose up --build -d
> ```

### 2. Servicios disponibles al levantar:
| Servicio | Descripción | Puerto / URL |
| :--- | :--- | :--- |
| **Frontend** (`gym_frontend`) | Aplicación Angular servida por Nginx | [http://localhost:4200](http://localhost:4200) |
| **Backend** (`gym_backend`) | API REST Spring Boot 4 / Java 21 | [http://localhost:8080](http://localhost:8080) |
| **Swagger UI** | Documentación interactiva de la API | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) |
| **Base de Datos** (`gym_db`) | MariaDB 11 con volumen persistente | `localhost:3306` (`gymdb`) |

### 3. Detener los servicios:
```bash
docker compose down
```

> **Persistencia:** Los datos de la base de datos se conservan en el volumen de Docker `gym_mariadb_data`. Si deseas reiniciar la base de datos desde cero, usa `docker compose down -v`.

---

## Ejecución Local (Desarrollo sin Docker)

Si deseas correr únicamente el frontend en tu entorno local:

```bash
cd frontend-gym
npm install
npm start
```
La aplicación correrá en `http://localhost:4200/`.

### Ejecutar Pruebas:
```bash
npm test
```

### Compilar para Producción:
```bash
npm run build
```
