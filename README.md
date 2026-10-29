# ☁️ Media Uploader Backend

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![ImageKit](https://img.shields.io/badge/ImageKit-Cloud%20Media-blue.svg)](https://imagekit.io/)
[![Multer](https://img.shields.io/badge/Multer-Memory%20Buffer-orange.svg)](https://github.com/expressjs/multer)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Protected%20Auth-red.svg)](https://jwt.io/)

A simple, beginner-friendly, and cloud-native **Media Uploader Backend** built with **Express 5**, **ImageKit**, **Multer (In-Memory Buffer)**, and **MongoDB**.

This system allows authenticated users to upload files (images, PDFs, documents, audio, videos) directly to **ImageKit** from memory (RAM buffer) without saving temporary files to the server's hard disk!

---

## 💡 Why In-Memory Buffer (`memoryStorage`) Instead of Disk Storage?

Traditional tutorials often write uploaded files to local disk folders (`public/uploads`) using `multer.diskStorage`, read them with `fs.createReadStream()`, and then delete them using `fs.unlinkSync()`.

**Why In-Memory Buffer is better:**
1. **Zero Disk Clutter**: The file is stored in memory as a `Buffer` (`req.file.buffer`) and streamed directly to ImageKit.
2. **No Temp Files or Manual Deletion**: No need for `fs.unlinkSync()` or managing local upload folders.
3. **Container & Cloud Friendly**: Works natively on Render, Docker, AWS, and serverless platforms where local disk is read-only or ephemeral.

---

## 🏛️ System Architecture

```text
 Client (Postman / Browser)
         │  (Multipart Form-Data)
         ▼
 Express 5 Server
         │
 ┌───────┴───────────────────────────────────────────────────────┐
 │ Middlewares                                                   │
 │ 1. authenticate (verifies JWT Bearer Token)                   │
 │ 2. upload.single("file") (Multer stores file in RAM Buffer)   │
 └───────┬───────────────────────────────────────────────────────┘
         │ (req.file.buffer)
         ▼
 Media Service Layer
         │ ──► toFile(file.buffer, file.originalname)
         │ ──► Uploads directly to ImageKit CDN via HTTPS
         │ ──► Returns { url, fileId, thumbnailUrl }
         ▼
 MongoDB Database
         └──► Saves record: { user, title, fileUrl, fileId, thumbnailUrl }
```

---

## 📂 Project Structure

```text
media uploader/
├── src/
│   ├── common/
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB connection
│   │   │   ├── email.js             # Mailtrap SMTP transporter
│   │   │   └── imagekit.js          # ImageKit SDK configuration
│   │   ├── middleware/
│   │   │   ├── multer.middleware.js # Multer in-memory storage config
│   │   │   └── validate.middleware.js
│   │   └── utils/
│   │       ├── api-error.js         # Standard error response helper
│   │       ├── api-response.js      # Standard success response helper
│   │       └── jwt.utils.js         # JWT signing & verification
│   ├── module/
│   │   ├── auth/                    # Complete Authentication module
│   │   │   ├── auth.controller.js   # Auth & avatar upload controllers
│   │   │   ├── auth.middleware.js   # JWT route protection middleware
│   │   │   ├── auth.model.js        # User model
│   │   │   ├── auth.routes.js       # /api/auth routes
│   │   │   └── auth.service.js      # Auth business logic & avatar buffer upload
│   │   └── media/                   # Media Upload module
│   │       ├── media.controller.js  # Media request handlers
│   │       ├── media.model.js       # Media schema
│   │       ├── media.routes.js      # /api/media routes
│   │       └── media.service.js     # ImageKit buffer upload & cloud delete
│   └── app.js                       # Express app configuration
├── env.example                      # Template environment variables
├── package.json
└── server.js                        # App entrypoint
```

---

## 📡 API Reference

### 🔐 1. Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register a new user |
| `POST` | `/api/auth/login` | None | Login & receive JWT access token |
| `GET` | `/api/auth/verify-email/:token` | None | Verify account email address |
| `GET` | `/api/auth/me` | Bearer | Get current logged-in user profile |
| `POST` | `/api/auth/avatar` | Bearer | Upload user avatar using **in-memory buffer** |
| `POST` | `/api/auth/logout` | Bearer | Logout and clear session cookies |

---

### 📁 2. Media Upload Routes (`/api/media`) — All Protected with `Bearer <token>`

#### 1. Upload Media File
- **Method**: `POST`
- **Endpoint**: `/api/media/upload`
- **Headers**: `Authorization: Bearer <your_token>`
- **Body Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: The file to upload (Image, PDF, Word Document, Audio, or Video)
  - `title` *(optional)*: Custom name/title for the file
- **Sample Success Response**:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "_id": "67223b...",
    "user": "67223a...",
    "title": "my-photo.png",
    "fileUrl": "https://ik.imagekit.io/your_endpoint/media-uploads/my-photo.png",
    "fileId": "67223b9f...",
    "thumbnailUrl": "https://ik.imagekit.io/your_endpoint/tr:n-media_library_thumbnail/media-uploads/my-photo.png",
    "mimeType": "image/png",
    "size": 104230,
    "createdAt": "2026-10-29T14:45:00.000Z"
  }
}
```

#### 2. Get All Files of Current User
- **Method**: `GET`
- **Endpoint**: `/api/media`
- **Headers**: `Authorization: Bearer <your_token>`

#### 3. Get Single File Details
- **Method**: `GET`
- **Endpoint**: `/api/media/:id`
- **Headers**: `Authorization: Bearer <your_token>`

#### 4. Delete File
- **Method**: `DELETE`
- **Endpoint**: `/api/media/:id`
- **Headers**: `Authorization: Bearer <your_token>`
- **Action**: Deletes file from **ImageKit cloud storage** and removes the record from **MongoDB**.

---

## ⚙️ Environment Variables Setup

Create a `.env` file from `env.example`:
```bash
cp env.example .env
```

Add your credentials:
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

## 🚀 How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run development server with watch mode
npm run dev
```

Visit health check at: `http://localhost:8080/health`.

---

## 🧪 Testing with Postman

1. **Login**: Send `POST http://localhost:8080/api/auth/login` to get your `accessToken`.
2. **Upload Media**:
   - `POST http://localhost:8080/api/media/upload`
   - **Headers**: `Authorization: Bearer <accessToken>`
   - **Body**: Select `form-data`
   - Key: `file` (select **File** dropdown), choose any file on your computer.
   - Click **Send**.
