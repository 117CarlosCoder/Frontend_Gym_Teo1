# ==========================================
# Etapa 1: Construcción de la app Angular
# ==========================================
FROM node:22-alpine AS build
WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar la aplicación para producción
RUN npm run build -- --configuration production

# ==========================================
# Etapa 2: Servidor Web Nginx
# ==========================================
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Eliminar configuración por defecto de Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Copiar archivo de configuración con soporte SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos estáticos compilados desde la etapa de build
COPY --from=build /app/dist/frontend-gym/browser /usr/share/nginx/html

# Exponer el puerto HTTP
EXPOSE 80

# Comando para ejecutar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]

