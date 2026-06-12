#!/bin/bash

# Script to generate a module structure for the Business Management Platform (Single-Port Setup)
# Usage: ./create-module.sh <module-name> <module-title> <backend-port>

MODULE_NAME=$1
MODULE_TITLE=$2
PORT_BACKEND=$3

if [ -z "$MODULE_NAME" ] || [ -z "$MODULE_TITLE" ] || [ -z "$PORT_BACKEND" ]; then
    echo "Usage: ./create-module.sh <module-name> <module-title> <backend-port>"
    echo "Example: ./create-module.sh inventory Inventory 8013"
    echo ""
    echo "Note: Frontend will be accessible at http://localhost/${MODULE_NAME}"
    echo "      Backend API will be at http://localhost:${PORT_BACKEND}"
    exit 1
fi

MODULE_DIR="modules/$MODULE_NAME"
FRONTEND_DIR="$MODULE_DIR/frontend"
BACKEND_DIR="$MODULE_DIR/backend"

echo "🏗️  Creating module: $MODULE_TITLE ($MODULE_NAME)"
echo "📍 Frontend path: /${MODULE_NAME} (via Nginx)"
echo "🔧 Backend port: $PORT_BACKEND"
echo ""

# Create directories
mkdir -p "$FRONTEND_DIR"/{src/{app,components,lib,types,hooks},public}
mkdir -p "$BACKEND_DIR"/{app/{api,models,schemas,services,core},tests}

# Create basic next.config.js with basePath
cat > "$FRONTEND_DIR/next.config.js" << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/${MODULE_NAME}',
  assetPrefix: '/${MODULE_NAME}',
  env: {
    NEXT_PUBLIC_API_URL: '/api',
  },
};

module.exports = nextConfig;
EOF

# Create basic package.json
cat > "$FRONTEND_DIR/package.json" << EOF
{
  "name": "@bmp/${MODULE_NAME}-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
EOF

# Create Dockerfile.dev for frontend
cat > "$FRONTEND_DIR/Dockerfile.dev" << EOF
FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
EOF

echo "✅ Module structure created at $MODULE_DIR"
echo ""
echo "📝 Next Steps:"
echo "1. Add module to docker-compose.yml:"
echo ""
echo "  ${MODULE_NAME}-frontend:"
echo "    build:"
echo "      context: ./modules/${MODULE_NAME}/frontend"
echo "      dockerfile: Dockerfile.dev"
echo "    container_name: bmp-${MODULE_NAME}-frontend"
echo "    environment:"
echo "      - NEXT_PUBLIC_API_URL=/api"
echo "      - NEXT_PUBLIC_MODULE=${MODULE_NAME}"
echo "    volumes:"
echo "      - ./modules/${MODULE_NAME}/frontend:/app"
echo "      - /app/node_modules"
echo "      - /app/.next"
echo "    networks:"
echo "      - bmp-network"
echo "    expose:"
echo "      - \"3000\""
echo ""
echo "  ${MODULE_NAME}-backend:"
echo "    build:"
echo "      context: ./modules/${MODULE_NAME}/backend"
echo "      dockerfile: Dockerfile.dev"
echo "    container_name: bmp-${MODULE_NAME}-backend"
echo "    ports:"
echo "      - \"${PORT_BACKEND}:8000\""
echo "    environment:"
echo "      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/business_management"
echo "      - REDIS_URL=redis://redis:6379"
echo "    depends_on:"
echo "      - postgres"
echo "      - redis"
echo "    volumes:"
echo "      - ./modules/${MODULE_NAME}/backend:/app"
echo "    networks:"
echo "      - bmp-network"
echo ""
echo "2. Add Nginx proxy rule to nginx/nginx.conf:"
echo ""
echo "  # ${MODULE_TITLE} Module"
echo "  location /${MODULE_NAME} {"
echo "      proxy_pass http://${MODULE_NAME}-frontend:3000;"
echo "  }"
echo ""
echo "3. Restart services:"
echo "   docker-compose up -d --build ${MODULE_NAME}-frontend ${MODULE_NAME}-backend"
echo ""
echo "4. Access module at: http://localhost/${MODULE_NAME}"
echo ""
