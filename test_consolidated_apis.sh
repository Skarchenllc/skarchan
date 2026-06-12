#!/bin/bash
echo "=========================================="
echo "Testing All 12 Consolidated Module APIs"
echo "=========================================="
echo ""

ORG_ID="550e8400-e29b-41d4-a716-446655440000"

# Test each module
modules=(
    "crm/accounts:CRM"
    "inventory/warehouses:Inventory"
    "scm/suppliers:SCM"
    "customer-service/support-tickets:Customer Service"
    "pm/projects:Project Management"
    "accounting/chart-of-accounts:Accounting"
    "hr/employees:HR"
    "marketing/campaigns:Marketing"
    "sales/opportunities:Sales"
    "production/work-orders:Production"
    "rd/rd-projects:R&D"
    "administration/compliance-audits:Administration"
)

success_count=0
fail_count=0

for module in "${modules[@]}"; do
    IFS=':' read -r endpoint name <<< "$module"

    response=$(curl -s "http://localhost/api/v1/$endpoint?organization_id=$ORG_ID")

    if echo "$response" | grep -q '"data"'; then
        total=$(echo "$response" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('total', 0))" 2>/dev/null || echo "0")
        echo "✅ $name: $total records"
        ((success_count++))
    else
        echo "❌ $name: FAILED"
        ((fail_count++))
    fi
done

echo ""
echo "=========================================="
echo "Summary: $success_count/12 modules working"
echo "=========================================="

if [ $fail_count -eq 0 ]; then
    echo "🎉 All modules successfully consolidated!"
    exit 0
else
    echo "⚠️  Some modules failed"
    exit 1
fi
