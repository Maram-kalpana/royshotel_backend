# Roy's Hotel API

Production-ready Node.js + Express + MySQL backend for the Roy's Book My Square Coliving hotel management frontend.

## Stack

- Node.js 18+ (ES Modules)
- Express.js
- MySQL2
- JWT + bcrypt
- Multer (file uploads)
- Helmet, CORS, Rate Limiting, Express Validator

## Quick Start

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials

npm install
npm run db:setup
npm run dev
```

API base URL: `http://localhost:5000/api`

## Default Admin Accounts

| Role | Username | Password |
|------|----------|----------|
| Super Admin | superadmin | SuperAdmin@123 |
| Admin | admin | Admin@123 |

## MilesWeb Deployment

1. Create MySQL database `roys_hotel` in MilesWeb panel
2. Upload `backend/` folder or deploy via Git
3. Set environment variables in Node.js app panel:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=roys_hotel`
   - `JWT_SECRET` (long random string)
   - `CORS_ORIGIN=https://your-frontend-domain.com`
   - `PORT` (usually provided by host)
4. Set **Startup file** to `server.js`
5. Run `npm install` then `npm run db:setup` once via SSH
6. Start the application

## Frontend Integration

Update Vite proxy or set API URL:

```js
// src/services/api.js
baseURL: import.meta.env.VITE_API_URL || '/api'
```

After login, store token:

```js
localStorage.setItem('hotel_token', response.data.token)
```

## Role Access

| Module | super_admin | admin |
|--------|:-----------:|:-----:|
| Dashboard | ✅ | ✅ |
| Rooms/Beds | ✅ | ✅ |
| Customers | ✅ | ✅ |
| Bookings | ✅ | ✅ |
| Monthly Tenants | ✅ | ✅ |
| Vacancy | ✅ | ✅ |
| Expenses | ✅ | ✅ |
| Settings | ✅ | ✅ |
| **Accounts / P&L** | ✅ | ❌ |

## API Documentation

See [docs/API.md](./docs/API.md)

## Postman

Import [postman/RoysHotel.postman_collection.json](./postman/RoysHotel.postman_collection.json)
