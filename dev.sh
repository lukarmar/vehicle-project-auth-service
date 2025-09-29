#!/bin/bash

# Script de desenvolvimento para Auth Service
echo "🚀 Starting Auth Service Development Environment..."

# Verificar se o Docker está rodando
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Parar containers existentes se necessário
echo "🧹 Stopping existing containers..."
docker-compose down

# Construir e subir os serviços
echo "🏗️ Building and starting services..."
docker-compose up --build -d

# Aguardar que os serviços estejam prontos
echo "⏳ Waiting for services to be ready..."
sleep 30

# Verificar se os serviços estão rodando
echo "🔍 Checking services status..."
echo ""
echo "Health checks:"
echo "- Auth Service: http://localhost:3001/health"
echo "- Keycloak: http://localhost:8080/health/ready"
echo ""

# Tentar verificar o status dos serviços
echo "Testing Auth Service health..."
curl -f http://localhost:3001/health 2>/dev/null && echo "✅ Auth Service is ready!" || echo "⚠️ Auth Service not ready yet"

echo ""
echo "Testing Keycloak health..."
curl -f http://localhost:8080/health/ready 2>/dev/null && echo "✅ Keycloak is ready!" || echo "⚠️ Keycloak not ready yet (may take a few more minutes)"

echo ""
echo "🔧 Auto-initializing Keycloak configuration..."
echo "   Creating admin user if not exists..."
echo "   This may take a few moments..."

echo ""
echo "🌟 Auth Service Development Environment Started!"
echo ""
echo "Available services:"
echo "- Auth Service API: http://localhost:3001"
echo "- Auth Service Health: http://localhost:3001/health"
echo "- Keycloak Admin: http://localhost:8080 (admin/admin)"
echo "- Keycloak Console: http://localhost:8080/admin"
echo "- Auth Database: localhost:5433"
echo ""
echo "🎭 Auto-created credentials:"
echo "- Keycloak Master Admin: admin/admin"
echo "- Vehicle Platform Admin: admin/admin123"
echo "- Realm: vehicle-platform"
echo ""
echo "To see logs: docker-compose logs -f auth-service"
echo "To stop: docker-compose down"