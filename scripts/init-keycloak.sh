#!/bin/sh

# Script para inicializar o Keycloak com usuário admin padrão
# Este script é executado após o Keycloak estar pronto

KEYCLOAK_URL="http://keycloak:8080"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
ADMIN_EMAIL="admin@vehicleplatform.com"
REALM_NAME="vehicle-platform"

echo "🔧 Inicializando configuração do Keycloak..."

# Função para aguardar o Keycloak estar pronto
wait_for_keycloak() {
    echo "⏳ Aguardando Keycloak estar pronto..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "${KEYCLOAK_URL}/health/ready" > /dev/null 2>&1; then
            echo "✅ Keycloak está pronto!"
            return 0
        fi
        echo "   Tentativa $attempt/$max_attempts - Aguardando..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "❌ Timeout: Keycloak não ficou pronto em tempo hábil"
    return 1
}

# Função para obter token de admin
get_admin_token() {
    local response=$(curl -s -X POST \
        "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=admin" \
        -d "password=admin" \
        -d "grant_type=password" \
        -d "client_id=admin-cli")
    
    # Extrair access_token usando grep e cut
    echo "$response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4
}

# Função para verificar se usuário já existe
user_exists() {
    local token=$1
    local username=$2
    local realm=$3
    
    local response=$(curl -s -X GET \
        "${KEYCLOAK_URL}/admin/realms/${realm}/users?username=${username}" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json")
    
    if echo "$response" | grep -q "\"username\":\"${username}\""; then
        return 0  # Usuario existe
    else
        return 1  # Usuario não existe
    fi
}

# Função para criar usuário
create_user() {
    local token=$1
    local username=$2
    local password=$3
    local email=$4
    local realm=$5
    
    local user_data='{
        "username": "'$username'",
        "email": "'$email'",
        "enabled": true,
        "emailVerified": true,
        "credentials": [{
            "type": "password",
            "value": "'$password'",
            "temporary": false
        }],
        "realmRoles": ["admin"]
    }'
    
    local response=$(curl -s -X POST \
        "${KEYCLOAK_URL}/admin/realms/${realm}/users" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json" \
        -d "$user_data" \
        -o /dev/null \
        -w "%{http_code}")
    
    if [ "$response" = "201" ] || [ "$response" = "200" ]; then
        return 0
    else
        echo "Código de resposta: $response"
        return 1
    fi
}

# Função para verificar se realm existe
realm_exists() {
    local token=$1
    local realm=$2
    
    local response=$(curl -s -X GET \
        "${KEYCLOAK_URL}/admin/realms/${realm}" \
        -H "Authorization: Bearer ${token}")
    
    if echo "$response" | grep -q "\"realm\":\"${realm}\""; then
        return 0  # Realm existe
    else
        return 1  # Realm não existe
    fi
}

# Função para importar realm
import_realm() {
    local token=$1
    
    if [ -f "/opt/keycloak/data/import/realm-export.json" ]; then
        echo "📥 Importando realm ${REALM_NAME}..."
        local response=$(curl -s -X POST \
            "${KEYCLOAK_URL}/admin/realms" \
            -H "Authorization: Bearer ${token}" \
            -H "Content-Type: application/json" \
            -d @/opt/keycloak/data/import/realm-export.json \
            -w "%{http_code}")
        
        echo "✅ Realm ${REALM_NAME} importado com sucesso!"
    else
        echo "⚠️  Arquivo realm-export.json não encontrado"
    fi
}

# Execução principal
main() {
    echo "🚀 Iniciando configuração automática do Keycloak..."
    
    # Aguardar Keycloak estar pronto
    if ! wait_for_keycloak; then
        exit 1
    fi
    
    # Obter token de administração
    echo "🔑 Obtendo token de administração..."
    admin_token=$(get_admin_token)
    
    if [ -z "$admin_token" ]; then
        echo "❌ Falha ao obter token de administração"
        exit 1
    fi
    
    echo "✅ Token de administração obtido"
    
    # Verificar se realm vehicle-platform existe
    if ! realm_exists "$admin_token" "$REALM_NAME"; then
        echo "📦 Realm ${REALM_NAME} não existe, importando..."
        import_realm "$admin_token"
        
        # Aguardar um pouco após a importação
        sleep 3
        
        # Obter novo token após importação do realm
        admin_token=$(get_admin_token)
    else
        echo "✅ Realm ${REALM_NAME} já existe"
    fi
    
    # Verificar se usuário admin já existe no realm
    if user_exists "$admin_token" "$ADMIN_USERNAME" "$REALM_NAME"; then
        echo "✅ Usuário admin já existe no realm ${REALM_NAME}"
    else
        echo "👤 Criando usuário admin no realm ${REALM_NAME}..."
        if create_user "$admin_token" "$ADMIN_USERNAME" "$ADMIN_PASSWORD" "$ADMIN_EMAIL" "$REALM_NAME"; then
            echo "✅ Usuário admin criado com sucesso!"
            echo "📋 Credenciais:"
            echo "   Username: ${ADMIN_USERNAME}"
            echo "   Password: ${ADMIN_PASSWORD}"
            echo "   Email: ${ADMIN_EMAIL}"
            echo "   Realm: ${REALM_NAME}"
        else
            echo "❌ Falha ao criar usuário admin"
            exit 1
        fi
    fi
    
    echo "🎉 Configuração do Keycloak concluída com sucesso!"
    echo "🌐 Acesse: ${KEYCLOAK_URL}"
    echo "🔐 Console Admin: ${KEYCLOAK_URL}/admin"
}

# Executar função principal
main "$@"