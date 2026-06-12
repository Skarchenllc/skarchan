#!/usr/bin/env python3
"""
Script to auto-generate module API files from database metadata
"""
import requests
import os
from pathlib import Path

# Get modules data from API
response = requests.get("http://localhost:8012/api/v1/development/modules-with-entity-types")
data = response.json()

# Base path for modules
base_path = Path(__file__).parent / "app" / "api" / "modules"

# Process remaining modules — skip any that already have a generated directory.
# The "done" set is derived from the filesystem rather than hardcoded.
for module in data['data']:
    module_code = module['module_code']

    if not module['entity_types']:
        continue
    if (base_path / module_code).exists():
        continue

    print(f"\n=== Creating {module_code} module ===")

    # Create module directory
    module_dir = base_path / module_code
    module_dir.mkdir(exist_ok=True)

    # Get entity types
    entities = module['entity_types']

    # Create __init__.py
    imports = []
    routers = []

    for entity in entities:
        entity_code = entity['entity_type_code']
        entity_label = entity['entity_type_label']

        # Convert entity_code to valid Python module name
        py_module_name = entity_code.replace('-', '_')

        imports.append(f"from . import {py_module_name}")

        # Create route prefix (kebab-case)
        route_prefix = entity_code.replace('_', '-')

        routers.append(f'router.include_router({py_module_name}.router, prefix="/{route_prefix}", tags=["{module["module_label"]} - {entity_label}"])')

        # Create individual entity file
        entity_file_content = f'''"""
{module['module_label']} {entity_label} API - Using Centralized Entity System
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("{module_code}", "{entity_code}")
'''

        entity_file_path = module_dir / f"{py_module_name}.py"
        with open(entity_file_path, 'w') as f:
            f.write(entity_file_content)

        print(f"  ✓ Created {py_module_name}.py")

    # Create __init__.py
    init_content = f'''"""
{module['module_label']} Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
{chr(10).join(imports)}

router = APIRouter()

{chr(10).join(routers)}
'''

    init_file_path = module_dir / "__init__.py"
    with open(init_file_path, 'w') as f:
        f.write(init_content)

    print(f"  ✓ Created __init__.py with {len(entities)} entities")

print("\n=== Module generation complete ===")
print("\nNext steps:")
print("1. Update app/main.py to import and include these modules")
print("2. Restart core-backend")
print("3. Test the APIs")
