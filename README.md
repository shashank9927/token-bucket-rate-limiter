# Token Bucket Rate Limiter API

A Node.js API that provides URL shortening functionality with a **custom-built token bucket rate limiting and blacklisting system** to prevent abuse while maintaining fair usage policies.
The system integrates **secure authentication**, **graduated response mechanisms**, and **admin control features**.

## Features

* **Secure URL Shortening**: Generate, expand, and visit shortened URLs
* **Token Bucket Rate Limiting**: Algorithm allowing burst traffic with controlled refill rates
* **Graduated Response Mechanism**: Warning-based system with temporary blacklisting
* **Role-Based Access Control**: Admin and standard user access levels
* **JWT Authentication**: Login system with HTTP-only cookies
* **Admin Control Panel**: Configure system rate limits, manage users, and view blacklist status

## Technology Stack

* **Backend**: Node.js and Express.js
* **Database**: MongoDB with Mongoose ODM
* **Authentication**: JSON Web Tokens (JWT) with HTTP-only cookies
* **Rate Limiting**: Custom token bucket implementation with refill logic

## 📸 Postman API Previews

### POST /api/shorten [Create a shortened URL with token check]

![Create Short URL](assets-postman/user/3.%20url-shorten.png)

---

### GET /api/rate-limit/status [View current token bucket status]

![Rate Limit Status](assets-postman/user/5.%20rate-limit-status.png)

---

### RATE LIMIT EXCEEDED [Blocked due to depleted token bucket]

![Rate Limit Exceeded](assets-postman/user/6.%20rate-limit-exceeded-error.png)

---

### BLACKLIST USER [Blacklisted due to excessive request]

![Blacklist user](assets-postman/user/7.%20blacklist-user-for-excessive-request.png)

---

### PUT /admin/rate-limits [Admin modifies system rate settings]

![Admin Settings](assets-postman/admin/4.%20change-rate-limit.png)

---

### GET /admin/blacklist [Blacklist management interface]

![Blacklist Management](assets-postman/admin/5.%20get-all-blacklist.png)

---

### DELETE /admin/blacklist/:userId [Remove a user from blacklist]

![Blacklist Removal](assets-postman/admin/6.%20delete-user-from-blacklist.png)


## API Endpoints

### Authentication

* `POST /auth/register` – Register a new user
* `POST /auth/login` – Login and receive JWT cookie

### URL Operations

* `POST /api/shorten` – Create a new shortened URL (uses tokens)
* `GET /api/expand/:shortCode` – Retrieve original URL
* `GET /api/visit/:shortCode` – Redirect to original URL

### Rate Limit Operations

* `GET /api/rate-limit/status` – Get remaining tokens and refill rate

### Admin Operations

* `GET /admin/rate-limits` – View current rate limit settings
* `PUT /admin/rate-limits` – Update global rate limit settings
* `GET /admin/blacklist` – View currently blacklisted users
* `DELETE /admin/blacklist/:id` - Remove a user from blacklist

## Rate Limiting Details

The token bucket algorithm works as follows:

* Each user has a **bucket** with:

  * **Max Tokens**: Default 100
  * **Refill Rate**: e.g., 10 tokens/minute
* Every request **costs tokens**:

  * Standard API calls: 2 tokens
  * URL shorten call: 4 tokens
* If tokens are **insufficient**, request is blocked (429 error)
* **Blacklist Trigger**:

  * After 20 blocked requests in 10 minutes, user is blacklisted for 1 hour

### Benefits

* **Burst Friendly**: Handles occasional spikes without harsh penalties
* **Configurable Per Operation**: Assign higher cost to heavier operations
* **Blacklisting System**: Prevents abuse with clear warning phase
* **Admin Control**: Fully adjustable settings via protected endpoints

## Getting Started

### Prerequisites

* Node.js 14.x or later
* MongoDB instance

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/shashank9927/token-bucket-rate-limiter
   cd token-bucket-rate-limiter
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Add environment variables
   Create a `.env` file:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/url-shortener
   JWT_SECRET=your_jwt_secret_key
   COOKIE_MAX_AGE=86400000
   ADMIN_REGISTER_KEY=admin_secret_key_123
   ```

4. Start the server

   ```bash
   npm start
   ```

## Security Features

* **HTTP-only JWT Cookies**: Protects token from client-side access
* **Password Hashing**: Bcrypt with salt for all credentials
* **Rate-Limiting Defense**: Prevents brute-force and abuse
* **Blacklist & Role System**: Clearly separates normal and admin users

## Project Structure

```
├─ src/
│  ├─ middleware/           # Auth & rate limit middleware
│  │  ├─ auth.js
│  │  └─ rateLimiter.js
│  ├─ models/               # MongoDB models
│  │  ├─ blacklist.js
│  │  ├─ rateLimit.js
│  │  ├─ settings.js
│  │  ├─ url.js
│  │  └─ user.js
│  ├─ routes/               # Express routes
│  │  ├─ admin.js
│  │  ├─ api.js
│  │  └─ auth.js
│  └─ server.js             # Main app entry
├─ assets-postman/          # Postman screenshots
│  ├─ user/
│  │  ├─ 1. user-register.png
│  │  ├─ 2. user-login.png
│  │  ├─ 3. url-shorten.png
│  │  └─ ...                # (more screenshots) 
│  ├─ admin/
│  │  ├─ 1. admin-register.png
│  │  ├─ 2. admin-login.png
│  │  ├─ 3. get-rate-limit-all-users.png
│  │  └─ ...					  # (more screenshots)
│  ├─ mongoose/
│  │  ├─ 1. mongoose-collections
│  │  └─ ...                # (more screenshots)
│  ├─ rate-limit-status.png
│  ├─ rate-limit-exceeded.png
│  └─ blacklist-management.png
├─ .env                     # Environment variables
├─ package.json             # NPM scripts and metadata
└─ README.md                # Project documentation```

## Author

Shashank Krishnaprasad

```
## License

This project is licensed under the ISC License - see the LICENSE file for details.
```
