# Shipping & Delivery — Complete Documentation

## Overview

The shipping system uses a **flat, hierarchical rule table** (`ShippingRule`) matched against structured address data extracted by the storefront via OpenStreetMap Nominatim geocoding.

It supports future courier API integrations via the **Provider Strategy Pattern** (see end of this doc) while keeping the storefront API contract stable.

---

## Key Concepts

| Concept | Description |
|---|---|
| **Shipping Rule** | A single database row defining a fee for a specific geographic scope. |
| **Hierarchical Matching** | The backend finds the most specific applicable rule automatically — no neighborhood entries required. |
| **Google Places Normalizer** | Backend strips suffixes (`Province`, `Metropolitan City`, `Municipality`, `Sub-Metropolitan`) before matching. |
| **Default Rule** | One rule may be marked `is_default=True` to act as a nationwide fallback. Only **one** may exist. |

---

## Shipping Rule Hierarchy

Matching stops at the **first valid rule found**, from most-specific to most-general:

| Priority | Coverage Level | Example Config | Fee |
|---|---|---|---|
| **1** | Province + District + City | Bagmati / Kathmandu / Kathmandu Metropolitan | NPR 100 |
| **2** | Province + District | Bagmati / Kathmandu | NPR 150 |
| **3** | Province only | Bagmati | NPR 200 |
| **4** | Default (nationwide) | `is_default=True` | NPR 300 |

> **Admin note:** Never create neighborhood-level rules (Anamnagar, Baneshwor, Kalanki). Those addresses automatically fall under the district or province rule.

---

## Storefront API

### POST /api/v1/storefront/shipping/calculate/

After the user selects an address via the Smart Address search (powered by Nominatim), the frontend extracts the structured `province`, `district`, and `city` fields and sends them here.

- **Auth:** Optional (works for guests too)
- **Content-Type:** `application/json`

#### Request Payload

All three geo fields are optional. The backend falls back to broader rules if narrower fields are missing.

```json
{
  "province": "Bagmati",
  "district": "Kathmandu",
  "city": "Kathmandu",
  "order_total": 2500.00
}
```

#### Success Response — HTTP 200

```json
{
  "success": true,
  "data": {
    "rule_id": "c1a2b3d4-5678-90ab-cdef-1234567890ab",
    "title": "Bagmati + Kathmandu + Kathmandu Metropolitan",
    "fee": 100.00,
    "estimated_days": "2-3 Business Days"
  }
}
```

#### No Match Response — HTTP 404

```json
{
  "success": false,
  "message": "Shipping is currently not available for this location."
}
```

> **Frontend note:** The API always returns **one** matched rule (not an array). Display it immediately as the delivery fee — there is no user selection step.

---

## Backoffice API (Admin)

### 1. List All Rules

```
GET /api/v1/backoffice/shipping/rules/
Authorization: Bearer <token>
```

Returns an array (or paginated `{ results: [...] }` depending on backend config) of all `ShippingRule` objects.

**Response item shape:**

```json
{
  "id": "uuid",
  "title": "Bagmati + Kathmandu",
  "province": "Bagmati",
  "district": "Kathmandu",
  "city_or_municipality": null,
  "shipping_fee": 150.00,
  "estimated_days": "2-4 Business Days",
  "is_default": false,
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

---

### 2. Create a Rule

```
POST /api/v1/backoffice/shipping/rules/
Authorization: Bearer <token>
Content-Type: application/json
```

#### Standard Geo-Based Rule

```json
{
  "title": "Bagmati + Kathmandu + Kathmandu Metropolitan",
  "province": "Bagmati",
  "district": "Kathmandu",
  "city_or_municipality": "Kathmandu",
  "shipping_fee": 100.00,
  "estimated_days": "2-3 Business Days",
  "is_default": false,
  "is_active": true
}
```

> **Field name:** The city field is `city_or_municipality` (NOT `city`). This matches the backend model exactly.

#### Default (Nationwide) Rule

```json
{
  "title": "Default Nationwide",
  "shipping_fee": 300.00,
  "estimated_days": "7-10 Business Days",
  "is_default": true,
  "is_active": true
}
```

> For default rules, `province`, `district`, and `city_or_municipality` must be omitted (or null). Only **one** default rule is allowed — the serializer will reject a second.

---

### 3. Retrieve a Single Rule

```
GET /api/v1/backoffice/shipping/rules/{id}/
Authorization: Bearer <token>
```

---

### 4. Update (Partial) a Rule

```
PATCH /api/v1/backoffice/shipping/rules/{id}/
Authorization: Bearer <token>
Content-Type: application/json
```

Send only the fields you want to change:

```json
{
  "shipping_fee": 120.00,
  "estimated_days": "1-2 Business Days"
}
```

---

### 5. Delete a Rule

```
DELETE /api/v1/backoffice/shipping/rules/{id}/
Authorization: Bearer <token>
```

Returns **HTTP 204 No Content** on success.

---

### 6. Toggle Rule Activation

```
POST /api/v1/backoffice/shipping/rules/{id}/toggle/
Authorization: Bearer <token>
```

Quickly flips `is_active` without editing the full payload. Ideal for disabling a province during a delivery strike.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_active": false
  },
  "message": "Rule deactivated successfully"
}
```

---

## Frontend Integration Guide

### Admin Panel (Backoffice)

| Feature | Implementation |
|---|---|
| **List rules** | `GET /backoffice/shipping/rules/` → render table rows |
| **Create rule** | Form with `title`, `province`, `district`, `city_or_municipality`, `shipping_fee`, `estimated_days`, `is_default`, `is_active` |
| **Edit rule** | `PATCH /backoffice/shipping/rules/{id}/` with changed fields |
| **Delete rule** | `DELETE /backoffice/shipping/rules/{id}/` |
| **Toggle** | `POST /backoffice/shipping/rules/{id}/toggle/` — no form required |
| **Default rule** | Show in a separate hero banner at the top; warn on deletion |

**Key field mapping (frontend form → API payload):**

| Form Label | API Field | Notes |
|---|---|---|
| Rule Title | `title` | Required always |
| Province | `province` | Required unless `is_default` |
| District | `district` | Optional — leave blank for province-only coverage |
| City / Municipality | `city_or_municipality` | Optional — leave blank for district-only coverage |
| Shipping Fee (NPR) | `shipping_fee` | Number, not string |
| Estimated Days | `estimated_days` | Free text, e.g. "2-3 Business Days" |
| Nationwide Fallback | `is_default` | Boolean |
| Operational Status | `is_active` | Boolean |

---

### Checkout (Storefront)

1. **Single Address Input:** Use the Smart Address field (Nominatim autocomplete). Never use cascading dropdowns.

2. **Extract Fields from Nominatim result:**

   | Nominatim `address` field | Sent to API as |
   |---|---|
   | `addr.state` (strip ` Province`) | `province` |
   | `addr.county` or `addr.district` | `district` |
   | `addr.city`, `addr.town`, `addr.village`, or `addr.municipality` | `city` |

3. **Calculate Fee:** Automatically POST to `POST /api/v1/storefront/shipping/calculate/` when the user selects a location. Display the returned `data.fee` and `data.estimated_days`.

4. **Error States:**
   - HTTP 404 / `success: false` → "We currently do not deliver to this location."
   - Network error → "We currently do not deliver to this location."

5. **Order Total:** Include the `shippingResult.fee` in the grand total. Store `shippingResult.rule_id` to snapshot onto the order when the Orders module is ready.

6. **Delivery Instructions:** Store the landmark/notes field value as `delivery_instructions` — POST it to `POST /api/v1/orders/` when the Orders module is ready.

---

## Business Logic & Rules

1. **Normalization:** The backend strips suffixes (`Province`, `Metropolitan City`, `Municipality`, `Sub-Metropolitan`) from incoming address strings before matching. Admins enter clean names (e.g. `Bagmati`, not `Bagmati Province`).

2. **Hierarchical Matching (first match wins):**
   - Province + District + City → most specific
   - Province + District
   - Province only
   - Default (`is_default=True`) → nationwide fallback

3. **No Match:** API returns HTTP 404 with `{ "success": false, "message": "..." }`.

4. **One Default Rule:** Only one `is_default=True` rule is permitted. The serializer enforces this.

5. **Snapshotting (Orders Module):** Once a fee is selected at checkout, it will be snapshotted onto the `Order` record. Future admin price changes will **not** affect historical orders.

---

## TypeScript Types Reference

```typescript
// types/shipping.ts

// Backoffice
interface ShippingRule {
  id: string;
  title: string;
  province: string;
  district?: string;
  city_or_municipality?: string;
  shipping_fee: number;
  estimated_days: string;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CreateShippingRule {
  title: string;
  province?: string;
  district?: string;
  city_or_municipality?: string;
  shipping_fee: number;
  estimated_days: string;
  is_default: boolean;
  is_active: boolean;
}

// Storefront
interface ShippingCalculationRequest {
  province?: string;
  district?: string;
  city?: string;
  order_total: number;
}

interface ShippingCalculationResult {
  rule_id: string;
  title: string;
  fee: number;
  estimated_days: string;
}

interface ShippingCalculationResponse {
  success: boolean;
  data?: ShippingCalculationResult;
  message?: string;
}
```

---

## API Service Functions Reference

```typescript
// lib/api/shipping.ts

// Backoffice
fetchShippingRules(token?)             // GET  /backoffice/shipping/rules/
createShippingRule(data, token?)       // POST /backoffice/shipping/rules/
fetchShippingRule(id, token?)          // GET  /backoffice/shipping/rules/{id}/
updateShippingRule(id, data, token?)   // PATCH /backoffice/shipping/rules/{id}/
deleteShippingRule(id, token?)         // DELETE /backoffice/shipping/rules/{id}/
toggleShippingRule(id, token?)         // POST /backoffice/shipping/rules/{id}/toggle/

// Storefront
calculateShipping(data)               // POST /storefront/shipping/calculate/
```

---

## Future: Adding Courier APIs (Pathao, Aramex, etc.)

The `ShippingProvider` model already has `provider_type` (`MANUAL` or `API`) and a JSON `configuration` column for API keys.

### How to Implement

1. **Save credentials** in the `ShippingProvider` table via a "Couriers" screen in Logistics Studio.
2. **Create a new class** in `apps/shipping/services/shipping_service.py` (e.g. `PathaoShippingProvider`) that fetches live rates from the courier's API.
3. **Register it** in `ShippingService.get_provider()`.
4. **No storefront changes needed** — the `POST /storefront/shipping/calculate/` endpoint signature stays identical.
