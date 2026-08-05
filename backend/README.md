# APILens Backend Service

A production-ready, highly scalable REST and WebSocket API backend built with **Node.js**, **Express.js**, **MongoDB**, and **Socket.IO**. This backend serves as the core execution engine, authentication service, and real-time statistics aggregator for the APILens testing platform.

---

## Architecture Breakdown

The project follows a clean MVC / Service-oriented structure:

```
backend/
├── src/
│   ├── config/       # Config modules (MongoDB, Swagger OpenAPI)
│   ├── controllers/  # Business controller handlers (JWT, request forwarded engine, stats calculations)
│   ├── middleware/   # Express security and request guards (JWT validators, global error, rate limiters)
│   ├── models/       # Database Schemas (User, History, Collection)
│   ├── routes/       # Express route mappings
│   ├── sockets/      # Real-time WebSocket handlers (Socket.IO metrics, active user counters)
│   └── app.js        # Express app initializer
├── server.js         # Entry point (HTTP Server bootstrap)
├── package.json      # Dependencies and start scripts
└── README.md
```

---

## Tech Stack & Features

* **Express.js**: Core REST router framework.
* **Mongoose & MongoDB**: Dynamic data schemas, compound indexes for pagination, and aggregation pipelines.
* **Socket.IO**: WebSocket protocol for real-time online connections and metrics synchronization.
* **Axios Engine**: Server-side client proxy to safely forward and measure target API queries.
* **JWT Hashing & Authentication**: Token rotation via access (15m) and refresh (7d) tokens, password hashing with **bcryptjs**.
* **Security & Defense**: Protected against standard attacks using **Helmet**, **CORS**, and **Express-Rate-Limit**.
* **OpenAPI Documentation**: Automatically generated interactive documentation accessible at `/api-docs` using **Swagger-UI-Express**.

---

## Setup & Running Locally

### 1. Requirements
- Node.js >= 18.x
- MongoDB Server running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI string.

### 2. Installation
Install dependencies in the backend root directory:
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the backend root directory (see `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/apilens
JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 4. Run Server
Start in development environment with automatic restarts (via nodemon):
```bash
npm run dev
```
For production launch:
```bash
npm start
```

---

## API Documentation

APILens Backend generates interactive REST definitions on boot. You can inspect, query, and test all routes by opening:
* **http://localhost:5000/api-docs**

### Endpoints Overview

#### 1. Authentication (`/api/auth`)
* `POST /register`: Registers user and generates access/refresh tokens.
* `POST /login`: Authenticates credentials and issues access/refresh tokens.
* `POST /refresh`: Grants a fresh access token using a refresh token.
* `POST /logout`: Invalidates the active refresh token.

#### 2. Request Execution (`/api/request`)
* `POST /execute`: Safely executes a query on the target endpoint (GET, POST, PUT, DELETE, PATCH). Captures headers, body, parameters, duration, size, and status code. Saves log history.

#### 3. Request History Logs (`/api/history`)
* `GET /`: Lists request logs with search queries, method filter, status class, and paging.
* `DELETE /`: Clears all history logs for the active user.
* `DELETE /:id`: Deletes a specific history record.
* `POST /:id/rerun`: Re-runs a specific history query.

#### 4. Collections (`/api/collections`)
* `GET /`: Lists all folders and collections.
* `POST /`: Creates an empty collection.
* `PUT /:id`: Updates collection metadata.
* `DELETE /:id`: Deletes collection.
* `POST /:id/requests`: Saves request template.
* `PUT /:id/requests/:requestId`: Updates request template parameters.
* `DELETE /:id/requests/:requestId`: Deletes request template.
* `POST /:id/folders`: Creates subfolder.
* `DELETE /:id/folders/:folderId`: Deletes folder.

#### 5. Statistics & Status (`/api/stats`)
* `GET /active-users`: Fetches actual count of connected users online.
* `GET /analytics`: Calculates average latency, p90, total volume, method splits, and slowest endpoints.

---

## WebSocket Event Mapping

Establish connections via Socket.IO Client pointing to `http://localhost:5000`.

### Handlers

#### 1. Authentication
Send `authenticate` event right after connecting to join user-specific private rooms for private collections sync:
```javascript
socket.emit('authenticate', 'YOUR_JWT_ACCESS_TOKEN');
```

#### 2. Server Broadcasts
* **`activeUsersCount`**: Pushes actual user connections online:
  ```json
  { "activeUsers": 5 }
  ```
* **`requestAnalyticsUpdate`**: Pushes new execution metrics:
  ```json
  {
    "id": "mongo_id",
    "method": "GET",
    "url": "https://api.com/v1",
    "status": 200,
    "duration": 45,
    "size": 412,
    "success": true,
    "timestamp": "2026-06-08T10:17:33.000Z"
  }
  ```
* **`collectionUpdate`**: Broadcasts when a user's collection modifies:
  ```json
  { "action": "UPDATE", "collection": { ... } }
  ```
