# =============================================================================
# Stage 1: Build the Spring Boot application with Maven
# =============================================================================
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /workspace

# Cache dependencies layer
COPY pom.xml ./
RUN mvn dependency:resolve -B || true

# Copy source code and package application (tests run separately in CI/local verification)
COPY src ./src
RUN mvn clean package -DskipTests -B

# =============================================================================
# Stage 2: Minimal, secure runtime image
# =============================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Install curl for container healthcheck and create non-root user
RUN apk add --no-cache curl \
    && addgroup -S procuraflow \
    && adduser -S fournisseurs -G procuraflow

# Copy executable JAR from build stage
COPY --from=build /workspace/target/service-fournisseurs.jar /app/app.jar
RUN chown -R fournisseurs:procuraflow /app

USER fournisseurs

# Agreed container port in integration contract
EXPOSE 8081

# Default non-sensitive runtime environment variables
ENV SERVER_PORT=8081 \
    DATABASE_SCHEMA=schema_fournisseurs \
    JPA_DDL_AUTO=validate \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD curl -fsS http://localhost:${SERVER_PORT}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
