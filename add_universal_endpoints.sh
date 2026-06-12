#!/bin/bash

# Script to add universal custom fields and workflows endpoints to all module backends

MODULES=("sales" "marketing" "hr" "accounting-finance" "production" "rd" "administration")
SHARED_FILE="/Users/afzalhussain/Sites/company_projects/AI Projects/systems/shared/universal_fields_api.py"

echo "Adding universal endpoints to all modules..."

for MODULE in "${MODULES[@]}"; do
    echo "Processing module: $MODULE"

    BACKEND_PATH="/Users/afzalhussain/Sites/company_projects/AI Projects/systems/modules/$MODULE/backend"

    if [ ! -d "$BACKEND_PATH" ]; then
        echo "  ⚠️  Backend not found for $MODULE, skipping..."
        continue
    fi

    # Create shared directory in module
    mkdir -p "$BACKEND_PATH/app/shared"

    # Copy universal API file
    cp "$SHARED_FILE" "$BACKEND_PATH/app/shared/universal_fields_api.py"

    # Create __init__.py if it doesn't exist
    touch "$BACKEND_PATH/app/shared/__init__.py"

    echo "  ✅ Added universal endpoints to $MODULE"
done

echo ""
echo "✨ Universal endpoints added to all modules!"
echo ""
echo "Next steps:"
echo "1. Each module needs to register these routes in their main.py"
echo "2. Add: from app.shared.universal_fields_api import router as universal_router"
echo "3. Add: app.include_router(universal_router, prefix='/api/v1', tags=['Universal Fields & Workflows'])"
