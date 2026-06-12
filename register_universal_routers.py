#!/usr/bin/env python3
"""
Script to register universal field routers in all module backends
"""

import os
import re

MODULES = [
    "accounting-finance",
    "production",
    "administration"
]

BASE_PATH = "/Users/afzalhussain/Sites/company_projects/AI Projects/systems/modules"

IMPORT_LINE = "from app.shared.universal_fields_api import router as universal_router"
ROUTER_LINE = 'app.include_router(universal_router, prefix="/api/v1", tags=["Universal Fields & Workflows"])'

def update_main_py(module_path):
    main_py = os.path.join(module_path, "backend/app/main.py")

    if not os.path.exists(main_py):
        print(f"  ⚠️  main.py not found for {os.path.basename(module_path)}")
        return False

    with open(main_py, 'r') as f:
        content = f.read()

    # Check if already added
    if "universal_router" in content:
        print(f"  ℹ️  Universal router already registered in {os.path.basename(module_path)}")
        return True

    # Add import after other imports
    lines = content.split('\n')
    new_lines = []
    import_added = False
    router_added = False

    for i, line in enumerate(lines):
        new_lines.append(line)

        # Add import after last 'from app.' import
        if not import_added and line.startswith('from app.') and (i + 1 >= len(lines) or not lines[i + 1].startswith('from app.')):
            new_lines.append(IMPORT_LINE)
            import_added = True

        # Add router registration after app.include_router(router
        if not router_added and 'app.include_router(router' in line and 'universal_router' not in line:
            new_lines.append(ROUTER_LINE)
            router_added = True

    if import_added and router_added:
        with open(main_py, 'w') as f:
            f.write('\n'.join(new_lines))
        print(f"  ✅ Updated {os.path.basename(module_path)}")
        return True
    else:
        print(f"  ⚠️  Could not auto-update {os.path.basename(module_path)}, manual update needed")
        return False

def main():
    print("Registering universal routers in module backends...\n")

    success_count = 0
    for module in MODULES:
        module_path = os.path.join(BASE_PATH, module)
        print(f"Processing {module}...")
        if update_main_py(module_path):
            success_count += 1

    print(f"\n✨ Successfully updated {success_count}/{len(MODULES)} modules!")

if __name__ == "__main__":
    main()
