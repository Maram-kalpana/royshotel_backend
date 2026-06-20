# Roy's Hotel API Documentation

Base URL: `/api`  
Auth: `Authorization: Bearer <token>`

## Auth

### POST /auth/login
```json
{ "username": "superadmin", "password": "SuperAdmin@123" }
```
Response:
```json
{ "success": true, "data": { "token": "...", "user": { "id", "name", "email", "role" } } }
```

### GET /auth/me
Returns current admin profile.

---

## Dashboard

### GET /dashboard/stats
Total rooms, beds, customers, bookings, expenses, collections.

### GET /dashboard/monthly-payments/stats
Monthly tenant KPIs.

### GET /dashboard/vacancy/stats
Vacant/occupied beds and rooms.

---

## Rooms

### GET /rooms?search=&floorNumber=
### POST /rooms
```json
{ "floorNumber": 1, "roomNumber": "101", "bedType": "Single", "acType": "A/C", "costOfBed": 5000, "numberOfBeds": 2 }
```
### PUT /rooms/:id
### DELETE /rooms/:id

---

## Beds

### GET /beds?status=vacant&floorNumber=&roomNumber=
### GET /beds/vacant

---

## Customers

### GET /customers?status=checked-in&search=&checkInDate=
### GET /customers/:id
### POST /customers
### PUT /customers/:id
### POST /customers/:id/checkout

---

## Bookings

### GET /bookings?search=&checkInDate=&paymentStatus=
### POST /bookings
```json
{
  "name": "John", "phone": "9876543210", "bedId": "bed-xxx",
  "stayType": "Days", "duration": 3, "checkInDateTime": "2026-06-20T14:00:00",
  "totalAmount": 3000, "advancePaid": 1000, "paymentType": "Cash", "paymentStatus": "pending"
}
```
### PUT /bookings/:id
### DELETE /bookings/:id

---

## Monthly Payments (Tenants)

### GET /monthly-payments?status=paid|pending|partial
### POST /monthly-payments
### POST /monthly-payments/:id/mark-paid
```json
{ "month": "June 2026", "amount": 8000, "paymentMode": "UPI", "paidDate": "2026-06-15" }
```
### DELETE /monthly-payments/:id

---

## Expenses

### GET /expenses?date=&search=
### GET /expenses/:id
### POST /expenses
```json
{ "type": "Maintenance", "date": "2026-06-15", "amount": 5000, "description": "Repair" }
```
### PUT /expenses/:id
### DELETE /expenses/:id

---

## Accounts (Super Admin Only)

### GET /accounts/summary?view=day|month&date=2026-06-20
Returns auto-calculated revenue, expenses, net profit, pending amounts.

### GET /accounts/profit-loss?year=2026
Monthly P&L breakdown.

**Business rules:**
- Revenue = booking payments + monthly rent payments
- Expenses = expense entries
- Net Profit = Revenue - Expenses
- No manual account entries

---

## Settings

### GET /settings
### PUT /settings
```json
{ "hotelName", "address", "phone", "email", "gstNumber" }
```

---

## Uploads

### POST /uploads
`multipart/form-data`: `file`, `field` (photo|aadhaarDoc|panDoc)

Response: `{ url: "/uploads/filename.jpg" }`

---

## Error Format

```json
{ "success": false, "message": "Error description", "errors": [] }
```
