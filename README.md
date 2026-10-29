# ☁️ Media Uploader Backend

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![ImageKit](https://img.shields.io/badge/ImageKit-Cloud%20Media-blue.svg)](https://imagekit.io/)
[![Multer](https://img.shields.io/badge/Multer-Memory%20Buffer-orange.svg)](https://github.com/expressjs/multer)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Protected%20Auth-red.svg)](https://jwt.io/)

A production-grade, secure, and cloud-native **Media Uploader Backend** built with **Express 5**, **ImageKit**, **Multer (Memory Storage / In-Memory Buffer)**, and **MongoDB**. 

This system provides enterprise-grade **JWT Authentication** (access & refresh tokens, email verification, password reset) and seamless media asset management (single upload, batch multi-upload, pagination, and cloud deletion) without writing temporary files to the server's hard drive.

---

## 💡 Why In-Memory Buffer (`memoryStorage`) Over Disk Storage?

Many traditional upload implementations save incoming multipart files to a local server folder (e.g. `public/uploads/`) using `multer.diskStorage`, read the file stream, send it to the cloud, and then call `fs.unlinkSync()` to delete it.

In modern containerized and serverless environments (Docker, AWS Lambda, Render, Vercel), **Disk Storage is an anti-pattern**:

| Feature | 🗄️ Traditional Disk Storage | ⚡ In-Memory Buffer (`memoryStorage`) (This Project) |
|---|---|---|
| **Storage Mechanism** | Writes to local filesystem (`public/uploads`) | Stored temporarily in RAM (`req.file.buffer`) |
| **Server Cleanup** | Requires manual `fs.unlink()` cleanup routines | Automatically garbage-collected by V8 runtime |
| **Disk I/O Overhead** | Slow disk write + disk read cycles | Zero disk I/O; fast memory transmission |
| **Cloud/Container Safe** | Fails on ephemeral / read-only filesystems | 100% compatible with Docker, Kubernetes, & Serverless |
| **Security** | Leaves unencrypted files sitting on server disk | Files never touch the physical disk |

---

## 🏛️ System Architecture

```text
 Client (Browser / Postman / Mobile)
        │
        ▼ (Multipart / Form-Data)
 Express 5 API Router
        │
 ┌──────┴──────────────────────────────────────────────────────┐
 │ Middleware Pipeline                                         │
 │ 1. CORS & Cookie Parser                                     │
 │ 2. JWT Authenticate Guard (Bearer Token verification)       │
 │ 3. Multer memoryStorage (Converts stream to RAM Buffer)     │
 └──────┬──────────────────────────────────────────────────────┘
        │ (req.file.buffer)
        ▼
 Media Service Layer
        │ ──► @imagekit/nodejs `toFile(buffer, filename)`
        │ ──► Uploads directly to ImageKit CDN via HTTPS
        │ ──► ImageKit returns { url, fileId, thumbnailUrl }
        ▼
 MongoDB Database
        └──► Saves metadata record (user ID, url, fileId, size, mimeType)
```

---

## 📂 Project Structure

```text
media uploader/
├── src/
│   ├── common/
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB Atlas / local connection
│   │   │   ├── email.js           # Mailtrap SMTP transporter
│   │   │   └── imagekit.js        # ImageKit SDK client configuration
│   │   ├── dto/
│   │   │   └── base.dto.js        # Joi schema validation base
│   │   ├── middleware/
│   │   │   ├── multer.middleware.js # In-memory buffer Multer configuration
│   │   │   └── validate.middleware.js # Request payload validation
│   │   └── utils/
│   │       ├── api-error.js       # Centralized Error class
│   │       ├── api-response.js    # Standardized JSON response envelope
│   │       └── jwt.utils.js       # Access/Refresh token signing & hashing
│   ├── module/
│   │   ├── auth/
│   │   │   ├── dto/               # Login, Register, Password DTOs
│   │   │   ├── auth.controller.js # Auth request handlers
│   │   │   ├── auth.middleware.js # Bearer token verification
│   │   │   ├── auth.model.js      # User schema with avatar reference
│   │   │   ├── auth.routes.js     # Auth route endpoints
│   │   │   └── auth.service.js    # Auth business logic & buffer avatar upload
│   │   └── media/
│   │       ├── media.controller.js# Media upload & CRUD handlers
│   │       ├── media.model.js     # Media schema (fileId, url, metadata)
│   │       ├── media.routes.js    # Media upload routes
│   │       └── media.service.js   # ImageKit buffer upload & cloud deletion
│   └── app.js                     # Express app instance & global error handlers
├── .gitignore
├── env.example                    # Template environment variables
├── package.json
└── server.js                      # Application entrypoint
```

---

## 📡 API Reference

### 🔐 Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register account (`name`, `email`, `password`) |
| `GET` | `/api/auth/verify-email/:token` | None | Verify email address from Mailtrap link |
| `POST` | `/api/auth/login` | None | Authenticate credentials, returns JWT `accessToken` & sets `refreshToken` |
| `POST` | `/api/auth/refresh-token` | None | Refreshes expired access token |
| `GET` | `/api/auth/me` | Bearer | Get authenticated user profile |
| `POST` | `/api/auth/logout` | Bearer | Invalidate session & clear cookies |
| `POST` | `/api/auth/avatar` | Bearer | Upload user profile picture directly to ImageKit via **RAM Buffer** |
| `POST` | `/api/auth/forgot-password` | None | Request 15-minute expiring password reset token |
| `PUT` | `/api/auth/reset-password/:token`| None | Set new password with valid reset token |

---

### 📁 Media Uploader Endpoints (`/api/media`)

All media endpoints require an `Authorization: Bearer <token>` header.

#### 1. Upload Single File
- **Method**: `POST`
- **Endpoint**: `/api/media/upload`
- **Body Type**: `multipart/form-data`
- **Fields**:
  - `file`: The media file (Image, PDF, Word Document, Audio, or Video)
  - `folder` *(optional)*: Target folder on ImageKit (e.g. `/portfolio`)
- **Response**:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "_id": "67223b...",
    "user": "67223a...",
    "fileName": "sample_a1b2c.png",
    "originalName": "sample.png",
    "fileId": "67223b9f...",
    "url": "https://ik.imagekit.io/your_endpoint/media-uploads/sample_a1b2c.png",
    "thumbnailUrl": "https://ik.imagekit.io/your_endpoint/tr:n-media_library_thumbnail/media-uploads/sample_a1b2c.png",
    "size": 104230,
    "mimeType": "image/png",
    "fileType": "image",
    "folder": "/media-uploads",
    "createdAt": "2026-10-29T14:45:00.000Z"
  }
}
```

#### 2. Upload Multiple Files (Batch Upload)
- **Method**: `POST`
- **Endpoint**: `/api/media/upload-multiple`
- **Body Type**: `multipart/form-data`
- **Fields**:
  - `files`: Multiple files (up to 10 files simultaneously)
  - `folder` *(optional)*: Target folder name

#### 3. Get All Uploaded Media (Paginated)
- **Method**: `GET`
- **Endpoint**: `/api/media?page=1&limit=10&fileType=image`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `fileType`: Filter by category (`image`, `document`, `video`, `audio`)

#### 4. Get Single Media File
- **Method**: `GET`
- **Endpoint**: `/api/media/:id`

#### 5. Delete Media File
- **Method**: `DELETE`
- **Endpoint**: `/api/media/:id`
- **Action**: Atomically deletes the file from **ImageKit cloud storage** and removes the metadata document from **MongoDB**.

---

## 🛡️ Supported File Types & Limits

- **Images**: JPEG, PNG, WebP, GIF, SVG
- **Documents**: PDF, Microsoft Word (.doc, .docx), Plain Text (.txt)
- **Audio & Video**: MP4, WebM, MP3, WAV
- **File Size Limit**: Up to **10MB** per file (configured in `multer.middleware.js`)

---

## ⚙️ Environment Variables Setup

Create a `.env` file from `env.example`:
```bash
cp env.example .env
```

Fill in your credentials:
```env
PORT=8080
NODE_ENV=development

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/media_uploader?authSource=admin&retryWrites=true&w=majority

# JWT Secrets
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_REFRESH_EXPIRES_IN=7d

# ImageKit Cloud Credentials
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint

# Mailtrap SMTP Configuration
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
SMTP_FROM_NAME="Media Uploader Service"
SMTP_FROM_EMAIL=noreply@mediauploader.com

CLIENT_URL=http://localhost:8080
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start in Development Mode
```bash
npm run dev
```

### 3. Start in Production Mode
```bash
npm start
```

The server starts on `http://localhost:8080`. Check health at `http://localhost:8080/health`.

---

## 🧪 Testing with Postman / ThunderClient

1. **Register**: `POST http://localhost:8080/api/auth/register` with JSON:
   ```json
   { "name": "John Doe", "email": "john@example.com", "password": "password123" }
   ```
2. **Login**: `POST http://localhost:8080/api/auth/login` to obtain your `accessToken`.
3. **Upload Media**:
   - `POST http://localhost:8080/api/media/upload`
   - Set Header: `Authorization: Bearer <your_access_token>`
   - Set Body to **form-data**
   - Key: `file` (type: **File**), select any image/PDF from your computer
   - Send request! ImageKit URL and file details will be returned instantly.
