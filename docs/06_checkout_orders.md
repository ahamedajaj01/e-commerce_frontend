# 🛒 Checkout & Orders Documentation

This document explains how the purchase journey works in the backend and how the frontend should interact with the Checkout Orchestration layer.

---

## 1. The Core Philosophy
We separate **Checkout** from **Orders** to prevent database pollution.
*   **CheckoutSession:** A temporary "Draft" state. It stores the customer's form data, calculates prices, and "freezes" the data so it doesn't change during payment.
*   **Order:** A permanent record created **only** after the checkout is successfully completed (e.g., Payment Success or COD confirmation).

---

## 2. The Buyer's Journey (Flow)

### Step 1: Initialize Checkout
When the user clicks "Checkout" from the cart, the frontend collects their name, address, and shipping choice.
*   **Action:** `POST /api/v1/checkout/storefront/sessions/`
*   **Result:** The backend calculates the **Total ETA** (Product Prep + Shipping Drive) and creates a `CheckoutSession`.

### Step 2: Payment / Review
The frontend redirects the user to a "Payment" or "Summary" page.
*   **Action:** `GET /api/v1/checkout/storefront/sessions/{uuid}/`
*   **Result:** The UI shows the final breakdown (Fee, Total, Arrival Date).

### Step 3: Complete & Convert
The user clicks "Complete Fulfillment" (COD) or finishes an online payment.
*   **Action:** `POST /api/v1/checkout/storefront/sessions/{uuid}/complete/`
*   **Result:** The backend "Promotes" the session to a real **Order**, creates the **Order Items**, and marks the **Cart as Completed**.

---

## 3. Key Concepts

### 🚚 Dynamic Delivery Estimation (The Total ETA)
The system automatically calculates the arrival date by summing two different parts:
1.  **Warehouse Dispatch:** How long it takes for a vendor to pack the item (e.g., 5 days).
2.  **Courier Transit:** How long it takes to drive to that specific city (e.g., 2 days).
3.  **Total:** The customer sees **7 days**.

### 📸 Data Snapshotting
Once a `CheckoutSession` is created, the price and shipping fee are **locked**. If an admin changes a price in the main catalog while a customer is paying, the customer still pays the price they saw when they started their session.

---

## 4. API Reference for Developers

### Create Session
`POST /api/v1/checkout/storefront/sessions/`
**Body:**
```json
{
  "name": "Ajaj Ahamed",
  "email": "user@example.com",
  "phone": "9821XXXXXX",
  "province": "Bagmati",
  "district": "Kathmandu",
  "city": "Kathmandu",
  "street": "Maitighar",
  "shipping_rule_id": "uuid-here",
  "payment_method": "COD" // Or "ONLINE"
}
```

### Complete Session
`POST /api/v1/checkout/storefront/sessions/{uuid}/complete/`
Returns: `{"order_number": "ORD-2026...", "order_id": "uuid"}`

---

## 5. Future Proofing: Adding Payment Gateways (eSewa, Khalti, etc.)
The system is designed to be payment-agnostic. 
To add a new provider:
1.  Frontend initiates Checkout with `payment_method: "ONLINE"`.
2.  The `CheckoutSession` is created and the `payment_id` is stored.
3.  On successful payment callback (Webhook), the backend simple calls:
    `CheckoutSessionService.complete_session(session)`
4.  The order is born!

---

## 6. Admin Panel (Backoffice)
Admins can monitor sessions to see where users are dropping off (Abandoned Carts).
*   **API:** `/api/v1/checkout/backoffice/sessions/`
