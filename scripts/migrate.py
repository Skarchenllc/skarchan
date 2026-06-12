#!/usr/bin/env python3
"""
Idempotent migration entrypoint.

Records live in the schemaless `entity_records` table, so the "schema" that
matters is the entity field definitions + filter picklists. This applies them in
order; every step is insert-if-missing, so it's safe to run repeatedly (CI, deploy).

Usage:  python3 scripts/migrate.py
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
STEPS = [
    "seed_entity_field_defs.py",   # entity field definitions
    "seed_filter_picklists.py",    # picklist option values
]


def main() -> int:
    for step in STEPS:
        path = os.path.join(HERE, step)
        print(f"== applying {step} ==")
        r = subprocess.run([sys.executable, path])
        if r.returncode != 0:
            print(f"!! {step} failed (exit {r.returncode})")
            return r.returncode
    print("✓ migrations applied")
    return 0


if __name__ == "__main__":
    sys.exit(main())
