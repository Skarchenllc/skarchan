"""Sales Management Products API - the sales price book (entity_records).

Uses entity_type `sales_products` (distinct from Production's `products`, which is
a different catalog) so the two never collide in the global entity_records table.
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("sales", "sales_products")
