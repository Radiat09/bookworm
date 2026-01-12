# Bookworm — Backend API 🐛📚

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](./package.json) [![Node.js](https://img.shields.io/badge/node-%3E%3D16-brightgreen.svg)](https://nodejs.org/) [![OpenAPI](https://img.shields.io/badge/OpenAPI-starter-orange.svg)](./docs/openapi.yaml)

A fast, TypeScript-based backend for a book management and recommendation system. Built with Express, MongoDB (Mongoose), Redis, Passport (local + Google OAuth), Cloudinary for file uploads, and several utility modules for books, genres, users, reviews, shelves, tutorials and recommendations.

> Screenshot / API examples available in `assets/screenshots/placeholder.svg` and `api-examples/` folder.

---

## Key Features ✅

- User authentication (local + Google OAuth)
- OTP support for verification flows
- CRUD for Books and Genres
- Reviews, Shelves, and Tutorials management
- Recommendation engine with scheduled cleanup (cron job)
- Cloudinary image uploads (multer + Cloudinary)
- Redis session/cache support
- Email sending (SMTP) and PDF invoice generation
- Seeds for super-admin, genres, and books on startup

---

## Tech Stack & Tools 🔧

- Node.js + TypeScript
- Express 5
- MongoDB (Mongoose)
- Redis
- Passport (local & Google OAuth)
- Cloudinary, Multer
- Nodemailer, PDFKit
- Zod for validation
- ESLint for linting

---

## Quick Start (Local Development) 🚀

1. Install dependencies:

```bash
npm install
```

2. Copy or create `.env` file at the repo root with required environment variables (see table below).

3. Start the dev server (hot reload):

```bash
npm run dev
```

4. Open: `http://localhost:PORT/` (default `PORT` is from your `.env`)

Note: On server startup the project runs the following seeds automatically: `seedSuperAdmin`, `seedGenres`, and `seedBooks` (see `src/server.ts`).

---

## Scripts

- `npm run dev` — Run in development mode using `ts-node-dev` (hot reload)
- `npm run start` — Start the built app (`dist/server.js`)
- `npm run build` — Compile TypeScript to `dist/`
- `npm run lint` — Run ESLint
- `npm run test` — Placeholder (no tests configured)

---

## Environment Variables (required) 🔐

Copy these into `.env` and fill values. The app validates presence of all required keys at startup.

| Variable                                                           | Purpose / Notes                                                            |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| PORT                                                               | Server port (e.g. 5000)                                                    |
| DB_URL                                                             | MongoDB connection URI                                                     |
| NODE_ENV                                                           | `development` or `production`                                              |
| BCRYPT_SALT_ROUND                                                  | Salt rounds for bcrypt (e.g. 10)                                           |
| JWT_ACCESS_SECRET                                                  | JWT access token secret                                                    |
| JWT_ACCESS_EXPIRES                                                 | Access expiry (e.g. `15m`)                                                 |
| JWT_REFRESH_SECRET                                                 | JWT refresh token secret                                                   |
| JWT_REFRESH_EXPIRES                                                | Refresh expiry (e.g. `7d`)                                                 |
| SUPER_ADMIN_EMAIL                                                  | Initial super admin email (seed)                                           |
| SUPER_ADMIN_PASSWORD                                               | Initial super admin password (seed)                                        |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL      | Google OAuth config                                                        |
| EXPRESS_SESSION_SECRET                                             | Session secret for express-session                                         |
| FRONTEND_URL                                                       | Allowed CORS origin                                                        |
| SSL\_\*                                                            | SSL / payment provider configuration (multiple vars for callbacks and IPN) |
| CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET | Cloudinary credentials for uploads                                         |
| SMTP_USER / SMTP_PASS / SMTP_PORT / SMTP_HOST / SMTP_FROM          | SMTP config for sending emails                                             |
| REDIS_HOST / REDIS_PORT / REDIS_USERNAME / REDIS_PASSWORD          | Redis connection info                                                      |
| SSL_IPN_URL                                                        | Payment IPN URL                                                            |

Example (.env snippet):

```env
PORT=5000
DB_URL=mongodb://localhost:27017/bookworm
NODE_ENV=development
BCRYPT_SALT_ROUND=10
JWT_ACCESS_SECRET=youraccesssecret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=yourrefreshsecret
JWT_REFRESH_EXPIRES=7d
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=changeme
EXPRESS_SESSION_SECRET=somesecret
FRONTEND_URL=http://localhost:3000
# ...cloudinary, smtp, redis, ssl configs...
```

---

## API Overview 🌐

Base path: `GET /` (health) and all APIs under `/api/v1`

Main resources:

- `/api/v1/auth` — signup, login, logout, OAuth
- `/api/v1/user` — user profile and management
- `/api/v1/otp` — OTP endpoints
- `/api/v1/genre` — genre CRUD
- `/api/v1/book` — book CRUD, search, stats, by-genre
- `/api/v1/shelf` — user book shelves
- `/api/v1/review` — book reviews
- `/api/v1/recommendation` — recommendation engine
- `/api/v1/tutorial` — tutorials and guides

Example: Create a book (requires auth)

```bash
curl -X POST "http://localhost:5000/api/v1/book" \
  -H "Content-Type: multipart/form-data" \
  -F "title=My Book" \
  -F "author=Author Name" \
  -F "cover=@./cover.jpg" # multer + cloudinary handles upload
```

Example: Search books

```bash
curl "http://localhost:5000/api/v1/book?q=harry+potter&limit=10"
```

---

## Deployment 🛠️

- Build the project:

```bash
npm run build
```

- Start (production):

```bash
npm run start
```

- Vercel deployment is configured via `vercel.json` which points to `dist/server.js`.

---

## Development Notes & Conventions 💡

- Validation is done with Zod; controllers use `catchAsync` and a centralized `globalErrorHandler`.
- Cron job (daily at 02:00 server time) cleans expired recommendations.
- Seeds run automatically on startup — remove or adjust if you don't want seeded data.
- Linting: `npm run lint` (ESLint config at repo root).

---

## Contributing ✨

Contributions are welcome — please open issues or PRs for fixes and features. Keep changes small and focused, add tests where appropriate, and run the linter.

---

## License

This project is licensed under the **ISC** license (see `package.json`).
