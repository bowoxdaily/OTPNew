# Markup Management API Documentation

## Overview
Sistem markup untuk menentukan profit dari penjualan OTP. Mendukung global markup dan per-service markup dengan perhitungan otomatis harga jual.

## Database Schema

### markup_settings table
```sql
- id: bigint (PK)
- service_id: text (nullable, unique) - Service identifier
- service_name: text - Display name (GLOBAL for global markup)
- markup_percentage: numeric - Persentase markup (e.g., 20 = 20%)
- markup_fixed: numeric - Fixed markup amount in Rp (e.g., 5000)
- is_active: boolean - Enable/disable this markup
- created_at, updated_at: timestamptz
```

### orders table (updated fields)
- provider_price: numeric - Harga dari provider
- markup_amount: numeric - Jumlah markup yang dikenakan
- reseller_price: numeric - Harga jual ke reseller

## API Endpoints

### 1. Get All Markups
```
GET /api/admin/markups
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "service_id": null,
      "service_name": "GLOBAL",
      "markup_percentage": 15,
      "markup_fixed": 1000,
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "service_id": "9985",
      "service_name": "Shopee",
      "markup_percentage": 20,
      "markup_fixed": 2000,
      "is_active": true,
      "created_at": "2025-01-15T10:05:00Z",
      "updated_at": "2025-01-15T10:05:00Z"
    }
  ]
}
```

---

### 2. Create/Update Markup
```
POST /api/admin/markups
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "service_id": "9985",           // Optional - null for global
  "service_name": "Shopee",       // Optional - auto "GLOBAL" if null
  "markup_percentage": 20,        // Required - 0-100
  "markup_fixed": 2000            // Required - amount in Rp
}
```

**Example - Global Markup:**
```json
{
  "service_id": null,
  "service_name": "GLOBAL",
  "markup_percentage": 15,
  "markup_fixed": 1000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Markup setting berhasil disimpan",
  "data": {
    "id": 2,
    "service_id": "9985",
    "service_name": "Shopee",
    "markup_percentage": 20,
    "markup_fixed": 2000,
    "is_active": true,
    "created_at": "2025-01-15T10:05:00Z",
    "updated_at": "2025-01-15T10:05:00Z"
  }
}
```

---

### 3. Toggle Active Status
```
PATCH /api/admin/markups/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "is_active": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Markup setting berhasil dinonaktifkan",
  "data": { ... }
}
```

---

### 4. Delete Markup
```
DELETE /api/admin/markups/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Markup setting berhasil dihapus"
}
```

---

## Pricing Calculation Formula

```
provider_price = harga dari provider
markup_percentage = persentase markup (e.g., 20 = 20%)
markup_fixed = fixed markup in Rp (e.g., 5000)

markup_from_percentage = provider_price × (markup_percentage / 100)
markup_amount = markup_from_percentage + markup_fixed
reseller_price = provider_price + markup_amount
```

### Example:
```
Provider Price: Rp 10.000
Markup: 15% + Rp 1.000

Calculation:
- markup_from_percentage = 10.000 × (15 / 100) = 1.500
- markup_amount = 1.500 + 1.000 = 2.500
- reseller_price = 10.000 + 2.500 = 12.500

User bayar: Rp 12.500
Platform untung: Rp 2.500
```

---

## How It Works in Order Flow

### 1. Buy Number Request
```json
POST /api/otp/buy
{
  "user_id": "user_xxx",
  "negara": "Russia",
  "layanan": "9985",
  "operator": "any",
  "price": null  // Optional - if not provided, calculated from markup
}
```

### 2. Backend Process
1. Order nomor dari provider API
2. Get provider price dari response
3. Get markup setting untuk service (fallback to global)
4. Calculate reseller_price = provider_price + markup
5. Check user balance >= reseller_price
6. Deduct balance dengan reseller_price
7. Save order dengan pricing details

### 3. Response
```json
{
  "success": true,
  "message": "Order nomor berhasil",
  "data": {
    "order_id": "xxx",
    "number": "+7812345678",
    "provider_price": 10000,        // Harga dari provider
    "markup_amount": 2500,          // Profit kita
    "reseller_price": 12500,        // Harga yg dibayar user
    "remaining_balance": 87500
  }
}
```

---

## Hierarchy

### Markup Lookup Priority:
1. Service-specific markup (if exists & active)
2. Global markup (if exists & active)
3. Default (0% + Rp 0)

### Example Scenario:
```
Global Markup: 15% + Rp 1.000
Shopee Markup: 20% + Rp 2.000
TikTok Markup: None (use global)

When order:
- Shopee (ID: 9985) → Use 20% + Rp 2.000
- TikTok (ID: xxxx) → Use 15% + Rp 1.000
- Other Service → Use 15% + Rp 1.000
```

---

## Admin UI Features

### MarkupManagement Component
Location: `frontend/src/views/admin/MarkupManagement.jsx`

Features:
- ✅ View all markups with example prices
- ✅ Add/Edit global or service-specific markups
- ✅ Toggle active/inactive
- ✅ Delete markup
- ✅ Real-time price calculation preview
- ✅ Error handling & notifications

### Integration
Add to admin dashboard routes:
```jsx
import MarkupManagement from '@/views/admin/MarkupManagement';

// In your admin routes:
<Route path="/admin/markups" element={<MarkupManagement />} />
```

---

## Testing

### cURL Examples

**Get all markups:**
```bash
curl -X GET http://localhost:3000/api/admin/markups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create global markup (15% + Rp 1.000):**
```bash
curl -X POST http://localhost:3000/api/admin/markups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": null,
    "service_name": "GLOBAL",
    "markup_percentage": 15,
    "markup_fixed": 1000
  }'
```

**Create service-specific markup:**
```bash
curl -X POST http://localhost:3000/api/admin/markups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "9985",
    "service_name": "Shopee",
    "markup_percentage": 20,
    "markup_fixed": 2000
  }'
```

**Toggle markup status:**
```bash
curl -X PATCH http://localhost:3000/api/admin/markups/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "is_active": false }'
```

**Delete markup:**
```bash
curl -X DELETE http://localhost:3000/api/admin/markups/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

### Security
- Semua endpoint memerlukan authentication & admin role
- User tidak bisa akses markup settings
- Hanya admin yang bisa manage markup

### Performance
- Markup settings di-cache di memory (call `getMarkupForService` efficient)
- Setiap order query markup dari DB (fallback ke cache bisa ditambah jika perlu)

### Future Enhancements
- [ ] Bulk import markup dari CSV
- [ ] Schedule markup changes
- [ ] Markup history & audit log
- [ ] A/B testing different markups
- [ ] Markup by country
- [ ] Seasonal markup adjustments
