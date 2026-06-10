# Inventory & Stock Report Documentation

## Overview
The inventory system has been fundamentally simplified. It is now a **native module** built directly into the Catalog (`ProductVariant` table). There is no longer a separate "Inventory" database table to sync. All stock levels are managed via the `stock_quantity` field directly on the `ProductVariant`.

The Inventory module now acts purely as a **Stock Report Dashboard** and a hub for logging manual stock adjustments (audit trails).

## Core Logic

### Inventory States
- **Available Quantity (`stock_quantity`):** Stock ready for immediate purchase. This field lives natively on the `ProductVariant` table.
- **Reserved Quantity:** Deprecated in the new simplified flow. Kept as a static `0` in API responses for backward compatibility.
- **Unlimited Stock Flag (`is_unlimited`):** Deprecated. Stock is now strictly numerical based on `stock_quantity`. (Kept as `false` in responses for backward compatibility).

### Stock Report Logic
The Inventory API (`GET /api/v1/backoffice/inventory/`) acts as a global master-list aggregator. It fetches all `ProductVariants` for visible products and returns them in a flat, dashboard-friendly JSON format. 

Because stock lives on the variant itself, **there are no longer any out-of-sync "stubs" or broken inventory links.** If a variant exists in the catalog, it automatically has a tracked stock quantity.

### Stock Movements
Every change to inventory (adjustments via the UI) is logged as a `StockMovement` to maintain a financial/business audit trail.
- **Types:** `IN` (Restock), `OUT` (Sale), `ADJUSTMENT` (Correction), `RETURN`.

---

## Backoffice API Endpoints

### 1. Stock Report Dashboard
Fetches the global stock overview of all variants belonging to active catalog products.
- **Endpoint:** `GET /api/v1/backoffice/inventory/`
- **Auth:** Backoffice Staff required
- **Rich Data Response:**
  ```json
  {
      "success": true,
      "data": [
          {
              "id": "v-uuid",
              "is_stub": false,
              "status": "SYNCHRONIZED",
              "variant": {
                  "id": "uuid",
                  "sku": "VAR-WHITE-SILK",
                  "name": "White Silk Sari",
                  "size": "FREESIZE",
                  "color": "Multicolor",
                  "price": "1200.00",
                  "product_id": "uuid",
                  "product_name": "White Silk Sari",
                  "product_image": "/media/products/images/sari.jpg"
              },
              "available_quantity": 50,
              "reserved_quantity": 0,
              "is_unlimited": false,
              "total_quantity": 50,
              "updated_at": "2024-05-24T..."
          }
      ]
  }
  ```
  *(Note: `is_stub`, `status`, `reserved_quantity`, and `is_unlimited` are now hardcoded polyfills for frontend stability and backward compatibility).*

### 2. Adjust Inventory (Manual Corrections)
Manually update stock levels for a specific variant. This instantly updates the `stock_quantity` on the `ProductVariant` and logs a historical movement.
- **Endpoint:** `POST /api/v1/backoffice/inventory/adjust/`
- **Auth:** Backoffice Staff required
- **Payload:**
  ```json
  {
      "variant_id": "uuid-of-variant",
      "quantity": 50,
      "movement_type": "IN",
      "note": "Restocking for Summer collection"
  }
  ```

### 3. Low Stock Alerts
Identify variants that need restocking (threshold: ≤ 5 units).
- **Endpoint:** `GET /api/v1/backoffice/inventory/low-stock/`
- **Auth:** Backoffice Staff required

---

## Frontend Integration Guide

1. **Inventory Dashboard:** Use `GET /api/v1/backoffice/inventory/` to render the main data grid. You can reliably use `available_quantity` or `total_quantity` as the single source of truth for stock counts.
2. **Availability Check (Storefront):** To allow "Add to Cart", check `variant.stock_quantity > 0`. 
3. **Stock Updates (Admin):** Use `POST /api/v1/backoffice/inventory/adjust/` when generating a restock. The ID you send should be the raw `variant_id` (the backend automatically scrubs 'v-' prefixes if they are accidentally sent).
4. **Simplification Note:** You no longer need to worry about "triggering" an inventory record creation. When you create a `ProductVariant` via the Catalog endpoints, its stock logic is instantly ready and active.
