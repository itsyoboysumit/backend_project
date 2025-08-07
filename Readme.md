# 📦 MERN Video Streaming Backend

This is the backend for a full-stack video streaming platform built with the **MERN stack** (MongoDB, Express.js, React, Node.js). It showcases my ability to build **robust, secure, and production-ready REST APIs** featuring video uploads, authentication, playlist management, and user subscriptions. This project is designed to highlight my backend development skills to potential employers.

## 🌐 Live Demo

👉 [https://miniyoutube459.netlify.app](https://miniyoutube459.netlify.app)

## 🧪 Demo Credentials (No Signup Required)

**Email:** `sumit@example.com`  
**Password:** `mySecurePassword321`

*Note: These credentials are for demo purposes only.*

---

## 🎯 Purpose of This Project

This project highlights my:
- Proficiency in Node.js, Express, MongoDB
- Ability to build RESTful APIs from scratch
- Experience in implementing scalable authentication systems (JWT, cookies)
- Hands-on integration of media services like **Cloudinary**
- Knowledge of secure coding practices and error handling
- API structuring using service/controller patterns

---

## 🧰 Tech Stack

| Layer         | Technology              |
|--------------|--------------------------|
| Runtime       | Node.js                 |
| Framework     | Express.js              |
| Database      | MongoDB (via Mongoose)  |
| Auth          | JWT, Cookies            |
| Media Hosting | Cloudinary              |
| Email Service | Nodemailer              |
| Environment   | dotenv                  |

---

## 🧪 Core Backend Features

- ✅ User registration, login, logout, and token refresh
- 🔐 Authentication with **HTTP-only cookies** and JWT
- 🧾 Full CRUD for videos, playlists, and comments
- 📁 Secure video upload with Cloudinary
- 🔔 Subscription system for channels
- 🎯 Centralized error handling middleware
- 📦 Modular folder structure following service/controller architecture

---

## 🔧 Installation & Setup

```bash
# Clone the project
$ git clone https://github.com/itsyoboysumit/backend_project.git
$ cd backend_project

# Install dependencies
$ npm install

# Setup environment variables
$ cp .env.example .env
# Edit .env file with your keys
```

### Sample `.env` configuration
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:3000
```

---

## ▶️ Running the Server

```bash
# Start development server
$ npm run dev
```

Server runs on: "https://backend-project-ger2.onrender.com/"

---

## 📁 Project Folder Structure

```bash
backend_project/
├── config/             # DB, Cloudinary, mail configs
├── controllers/        # Route logic handlers
├── middlewares/        # Auth, error, file upload
├── models/             # Mongoose schemas
├── routes/             # All API route endpoints
├── services/           # Business logic (auth, video, user, etc)
├── validations/        # Request body validations
├── utils/              # Helpers like async wrapper
└── index.js            # App entry point
```

---

## 📌 API Functional Areas

### Auth Routes (`/v1/auth`)
```js
POST   /register
POST   /login
POST   /logout
POST   /refresh-token
```

### User Routes (`/v1/users`)
```js
GET    /profile
PATCH  /profile
PATCH  /avatar
PATCH  /cover-image
GET    /channel/:username
```

### Video Routes (`/v1/videos`)
```js
POST   /upload
GET    /
GET    /:id
PATCH  /:id
PATCH  /:id/thumbnail
DELETE /:id
```

### Comment Routes (`/v1/comments`)
```js
POST   /:videoId
GET    /:videoId
DELETE /:commentId
```

### Playlist Routes (`/v1/playlist`)
```js
POST   /
GET    /user/:userId
GET    /:playlistId
PATCH  /:playlistId
DELETE /:playlistId
PATCH  /:playlistId/add/:videoId
PATCH  /:playlistId/remove/:videoId
```

### Subscription Routes (`/v1/subscriptions`)
```js
POST   /:channelId
GET    /
GET    /:channelId
```

---

## 🔒 Auth System

- JWT-based Access + Refresh Token flow
- HTTP-only secure cookies
- Refresh endpoint to renew tokens
- Middleware for route protection

---

## 🧠 Highlights for Recruiters

- 📌 Strong emphasis on modular code architecture
- ✅ Validations and secure upload handling
- 🔄 Follows best practices in REST API design
- 🧪 Structured for easy testing with tools like Postman
- ✉️ Email notification system using Nodemailer

---

## 🙋‍♂️ About Me

**Sumit Kumar**  
💼 Aspiring Full Stack Developer  
🔗 GitHub: [@itsyoboysumit](https://github.com/itsyoboysumit)  
📧 Email: [sumitkumar67670@gmail.com](mailto:sumitkumar67670@gmail.com)


This backend was built as part of a larger **YouTube Clone** platform to demonstrate my backend capabilities. You can explore the frontend here:
👉 [YouTube Frontend Repo](https://github.com/itsyoboysumit/YouTube-frontend-)


