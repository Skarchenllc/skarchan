#!/bin/bash

echo "========================================="
echo "🔍 System Health Check"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Docker Services
echo "1️⃣  Checking Docker Services..."
NGINX_STATUS=$(docker ps --filter "name=bmp-nginx" --format "{{.Status}}" 2>/dev/null)
FRONTEND_STATUS=$(docker ps --filter "name=bmp-core-frontend" --format "{{.Status}}" 2>/dev/null)
BACKEND_STATUS=$(docker ps --filter "name=bmp-core-backend" --format "{{.Status}}" 2>/dev/null)

if [[ $NGINX_STATUS == *"Up"* ]]; then
    echo -e "   ${GREEN}✓${NC} Nginx: Running"
else
    echo -e "   ${RED}✗${NC} Nginx: Not Running"
fi

if [[ $FRONTEND_STATUS == *"Up"* ]]; then
    echo -e "   ${GREEN}✓${NC} Core Frontend: Running"
else
    echo -e "   ${RED}✗${NC} Core Frontend: Not Running"
fi

if [[ $BACKEND_STATUS == *"Up"* ]]; then
    echo -e "   ${GREEN}✓${NC} Core Backend: Running"
else
    echo -e "   ${RED}✗${NC} Core Backend: Not Running"
fi
echo ""

# Test 2: Check Nginx Routing
echo "2️⃣  Testing Nginx Routing..."
NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$NGINX_RESPONSE" = "200" ]; then
    echo -e "   ${GREEN}✓${NC} Frontend accessible at http://localhost/"
else
    echo -e "   ${RED}✗${NC} Frontend not accessible (HTTP $NGINX_RESPONSE)"
fi
echo ""

# Test 3: Check Backend API
echo "3️⃣  Testing Backend API..."
BACKEND_RESPONSE=$(curl -s http://localhost:8012/)
if [[ $BACKEND_RESPONSE == *"status"* ]]; then
    echo -e "   ${GREEN}✓${NC} Core Backend API responding"
else
    echo -e "   ${RED}✗${NC} Core Backend API not responding"
fi
echo ""

# Test 4: Check Module Data
echo "4️⃣  Testing Module Data..."
MODULES=$(curl -s "http://localhost:8012/api/v1/development/modules-with-entity-types" 2>/dev/null)
if [[ $MODULES == *"data"* ]]; then
    MODULE_COUNT=$(echo "$MODULES" | python3 -c "import sys, json; d = json.load(sys.stdin); print(len(d['data']))" 2>/dev/null)
    echo -e "   ${GREEN}✓${NC} Module API working ($MODULE_COUNT modules available)"
else
    echo -e "   ${RED}✗${NC} Module API not responding"
fi
echo ""

# Test 5: Test Sample APIs Through Nginx
echo "5️⃣  Testing Sample APIs Through Nginx..."

# CRM Accounts
CRM_TEST=$(curl -s "http://localhost/api/v1/crm/accounts?organization_id=550e8400-e29b-41d4-a716-446655440000" 2>/dev/null)
if [[ $CRM_TEST == *"data"* ]]; then
    CRM_COUNT=$(echo "$CRM_TEST" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('total', 0))" 2>/dev/null)
    echo -e "   ${GREEN}✓${NC} CRM API: $CRM_COUNT accounts"
else
    echo -e "   ${YELLOW}⚠${NC} CRM API: No response"
fi

# Accounting Accounts
ACC_TEST=$(curl -s "http://localhost/api/v1/accounting/chart-of-accounts?organization_id=550e8400-e29b-41d4-a716-446655440000" 2>/dev/null)
if [[ $ACC_TEST == *"data"* ]]; then
    ACC_COUNT=$(echo "$ACC_TEST" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('total', 0))" 2>/dev/null)
    echo -e "   ${GREEN}✓${NC} Accounting API: $ACC_COUNT accounts"
else
    echo -e "   ${YELLOW}⚠${NC} Accounting API: No response"
fi

# HR Employees
HR_TEST=$(curl -s "http://localhost/api/v1/hr/employees?organization_id=550e8400-e29b-41d4-a716-446655440000" 2>/dev/null)
if [[ $HR_TEST == *"data"* ]]; then
    HR_COUNT=$(echo "$HR_TEST" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('total', 0))" 2>/dev/null)
    echo -e "   ${GREEN}✓${NC} HR API: $HR_COUNT employees"
else
    echo -e "   ${YELLOW}⚠${NC} HR API: No response"
fi

# Marketing Campaigns
MKT_TEST=$(curl -s "http://localhost/api/v1/marketing/campaigns?organization_id=550e8400-e29b-41d4-a716-446655440000" 2>/dev/null)
if [[ $MKT_TEST == *"data"* ]]; then
    MKT_COUNT=$(echo "$MKT_TEST" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('total', 0))" 2>/dev/null)
    echo -e "   ${GREEN}✓${NC} Marketing API: $MKT_COUNT campaigns"
else
    echo -e "   ${YELLOW}⚠${NC} Marketing API: No response"
fi

echo ""

# Test 6: Check Frontend Files
echo "6️⃣  Verifying Frontend Files..."
MODULE_PAGE=$(docker exec bmp-core-frontend test -f /app/src/app/modules/\[module\]/page.tsx && echo "exists" || echo "missing")
ENTITY_PAGE=$(docker exec bmp-core-frontend test -f /app/src/app/modules/\[module\]/\[entity\]/page.tsx && echo "exists" || echo "missing")

if [ "$MODULE_PAGE" = "exists" ]; then
    # Check if SharedHeader is imported
    HAS_HEADER=$(docker exec bmp-core-frontend grep -c "SharedHeader" /app/src/app/modules/\[module\]/page.tsx 2>/dev/null)
    if [ "$HAS_HEADER" -gt 0 ]; then
        echo -e "   ${GREEN}✓${NC} Module page with SharedHeader"
    else
        echo -e "   ${YELLOW}⚠${NC} Module page exists but missing SharedHeader"
    fi
else
    echo -e "   ${RED}✗${NC} Module page missing"
fi

if [ "$ENTITY_PAGE" = "exists" ]; then
    HAS_HEADER=$(docker exec bmp-core-frontend grep -c "SharedHeader" /app/src/app/modules/\[module\]/\[entity\]/page.tsx 2>/dev/null)
    if [ "$HAS_HEADER" -gt 0 ]; then
        echo -e "   ${GREEN}✓${NC} Entity page with SharedHeader"
    else
        echo -e "   ${YELLOW}⚠${NC} Entity page exists but missing SharedHeader"
    fi
else
    echo -e "   ${RED}✗${NC} Entity page missing"
fi
echo ""

# Summary
echo "========================================="
echo "📊 Summary"
echo "========================================="
echo ""
echo "System URLs:"
echo "  • Landing:      http://localhost/"
echo "  • Login:        http://localhost/login"
echo "  • Control Room: http://localhost/control-room"
echo ""
echo "Sample Module URLs:"
echo "  • Accounting:   http://localhost/modules/accounting"
echo "  • HR:           http://localhost/modules/hr"
echo "  • CRM:          http://localhost/modules/crm"
echo "  • Marketing:    http://localhost/modules/marketing"
echo ""
echo -e "${YELLOW}⚠ Important:${NC} If you don't see the header and navigation,"
echo "   clear your browser cache with:"
echo "   • Windows/Linux: Ctrl + Shift + R"
echo "   • Mac: Cmd + Shift + R"
echo ""
echo "========================================="