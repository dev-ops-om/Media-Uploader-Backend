# Authentication Service

A backend authentication service built with Node.js, Express, and MongoDB.

This project implements a modular (feature-based) structure with layered architecture (Routes -> DTO Validation -> Controller -> Service -> Model).

## Features

- **User Registration**: Password hashing with bcrypt, email verification token generation via crypto.
- **Email Verification**: Token lookup and verification with single-use token invalidation.
- **JWT Authentication**: Short-lived access token paired with a long-lived refresh token stored in an httpOnly cookie.
- **Token Rotation & Logout**: Refresh token rotation and database-level revocation on logout.
- **Password Reset**: Timed reset tokens (15-minute expiry) and email notifications via Nodemailer / Mailtrap.
- **Request Validation**: DTO layer using Joi schemas to sanitize and validate request bodies before controllers run.
- **Error Handling**: Custom `ApiError` class with a global Express error-handling middleware and standardized `ApiResponse` format.
- **Containerized Database**: MongoDB instance managed via Docker Compose.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB 8 (Docker) with Mongoose
- **Validation**: Joi
- **Auth**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Email**: Nodemailer (Mailtrap for development SMTP)

## Project Structure

```
├── docker-compose.yml
├── env.example
├── package.json
├── server.js
└── src/
    ├── app.js
    ├── common/
    │   ├── config/       # db and email configuration
    │   ├── dto/          # BaseDto validation class
    │   ├── middleware/   # validation middleware
    │   └── utils/        # ApiError, ApiResponse, jwt/crypto helpers
    └── module/
        └── auth/
            ├── dto/      # request validation schemas
            ├── auth.controller.js
            ├── auth.middleware.js
            ├── auth.model.js
            ├── auth.routes.js
            └── auth.service.js
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/dev-ops-om/authentication-service.git
cd authentication-service
```

### 2. Set up environment variables

Copy `env.example` to `.env`:

```bash
cp env.example .env
```

Update `.env` with your configuration (e.g. Mailtrap credentials for testing emails):

```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://admin:password@localhost:27017/cohort?authSource=admin

JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
SMTP_FROM_NAME="Auth Service"
SMTP_FROM_EMAIL=noreply@authservice.com

CLIENT_URL=http://localhost:4000
```

### 3. Start MongoDB

```bash
docker compose up -d
```

### 4. Install dependencies and start server

```bash
npm install
npm run dev
```

The server runs on `http://localhost:4000`.

## API Endpoints

All auth routes are prefixed with `/api/auth`:

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | Public |
| `GET` | `/api/auth/verify-email/:token` | Verify email address | Public |
| `POST` | `/api/auth/login` | Login and receive access token + refresh cookie | Public |
| `POST` | `/api/auth/refresh-token` | Obtain new access token via refresh cookie | Cookie |
| `GET` | `/api/auth/me` | Get current user profile | Bearer Token |
| `POST` | `/api/auth/forgot-password` | Request password reset email | Public |
| `PUT` | `/api/auth/reset-password/:token` | Reset password using valid token | Public |
| `POST` | `/api/auth/logout` | Invalidate refresh token and clear cookie | Bearer Token |
