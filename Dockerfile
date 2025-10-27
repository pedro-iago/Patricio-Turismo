# Etapa 1 — Build do frontend (React)
FROM node:22 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build 
# O build final do React está agora em /app/frontend/build

# -------------------------------------------------------------

# Etapa 2 — Build do backend (Spring Boot)
FROM maven:3.9.9-eclipse-temurin-21 AS backend-build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src

# CORREÇÃO ESSENCIAL: Copia a saída do build do frontend 
# para o local de recursos estáticos do Spring Boot antes de empacotar o JAR.
COPY --from=frontend-build /app/frontend/build /app/src/main/resources/static

# Constrói o JAR com o frontend agora incluído no caminho /static
RUN mvn clean package -DskipTests

# -------------------------------------------------------------

# Etapa 3 — Imagem final (Spring Boot monolítico)
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Copia o JAR compilado (que agora contém o frontend)
COPY --from=backend-build /app/target/*.jar app.jar

# Variáveis de ambiente (ajuste se precisar)
ENV PORT=8080
EXPOSE 8080

# Comando para rodar
ENTRYPOINT ["java", "-jar", "app.jar"]