# URL Shortener API with Token Bucket Rate Limiting

URL Shortener API developed using Node.js, Express.js and MongoDB, incorporating "token bucket rate limiting algorithm" to manage and prevent excessive API requests.


## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [URL Shortening](#url-shortening)
  - [Rate Limiting](#rate-limiting)
  - [Admin Controls](#admin-controls)
- [Token Bucket System](#token-bucket-system)
- [System Architecture](#system-architecture)
- [Security](#security)
- [License](#license)

## Overview

URL Shortener API is a comprehensive solution for creating, managing, and accessing shortened URLs with advanced rate limiting protection. Built with Node.js and Express.js, it implements a sophisticated token bucket algorithm to ensure fair resource allocation and prevent abuse. The system allows users to create shortened URLs while protecting against excessive use through a unique combination of rate limiting and graduated response to abuse attempts.

## Features

- **URL Shortening**: Create, expand, and visit shortened URLs
- **Token Bucket Rate Limiting**: Fair resource allocation with configurable parameters
- **Graduated Response to Abuse**: Warning system before blacklisting
- **Role-based Access Control**: User and admin roles with different permissions
- **Secure Authentication**: JWT-based authentication system with HTTP-only cookies
- **Admin Controls**: Comprehensive management of rate limits and blacklisted users
- **Configurable Parameters**: Adjustable token costs, refill rates, and blacklist thresholds

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Cookie Management**: HTTP-only cookies for secure token storage
- **Password Security**: bcrypt for password hashing
- **Rate Limiting**: Custom token bucket implementation

## Installation

```bash
# Clone the repository
git clone https://github.com/shashank9927/token-bucket-rate-limiter
cd token-bucket-rate-limiter

# Install dependencies
npm install

# Start the server
npm start

# Development mode with auto-reload
npm run dev
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/url-shortener
JWT_SECRET=your_jwt_secret_key
COOKIE_MAX_AGE=86400000
ADMIN_REGISTER_KEY=admin_secret_key_123
```

## API Documentation

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "userId": "60d21b4667d0d8992e610c85",
    "username": "testuser",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "userId": "60d21b4667d0d8992e610c85",
    "username": "testuser",
    "role": "user"
  }
}
```

#### Register Admin
```http
POST /auth/admin/register
Content-Type: application/json

{
  "username": "adminuser",
  "email": "admin@example.com",
  "password": "adminpass123",
  "adminKey": "admin_secret_key_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "user": {
    "userId": "60d21b4667d0d8992e610c86",
    "username": "adminuser",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

#### Login Admin
```http
POST /auth/admin/login
Content-Type: application/json

{
  "username": "adminuser",
  "password": "adminpass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "userId": "60d21b4667d0d8992e610c86",
    "username": "adminuser",
    "role": "admin"
  }
}
```

#### Logout
```http
POST /auth/logout
Cookie: token=<jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### URL Shortening

#### Create Short URL
```http
POST /api/shorten
Cookie: token=<jwt_token>
Content-Type: application/json

{
  "url": "https://example.com/very/long/url"
}
```

**Response:**
```json
{
  "shortCode": "Abc123",
  "fullUrl": "https://example.com/very/long/url",
  "shortUrl": "http://localhost:3000/api/visit/Abc123"
}
```

#### Expand Short URL
```http
GET /api/expand/:shortCode
Cookie: token=<jwt_token>
```

**Response:**
```json
{
  "shortCode": "Abc123",
  "fullUrl": "https://example.com/very/long/url"
}
```

#### Visit Short URL
```http
GET /api/visit/:shortCode
Cookie: token=<jwt_token>
```

**Response:** Redirects to the full URL

### Rate Limiting

#### Check Rate Limit Status
```http
GET /api/rate-limit/status
Cookie: token=<jwt_token>
```

**Response:**
```json
{
  "userId": "user123",
  "tokensRemaining": 95,
  "maxTokens": 100,
  "refillRatePerMinute": 10,
  "requestCosts": {
    "standard": 1,
    "shortenUrl": 5
  },
  "blacklistStatus": {
    "rateLimitedAttempts": 5,
    "threshold": 20,
    "windowMinutes": 10,
    "attemptsResetMinutes": 8,
    "warningMessage": "Warning: You have made 5 of 20 allowed attempts while rate limited. This counter resets in 8 minutes."
  },
  "resetSeconds": 10
}
```

#### Rate Limit Exceeded Error
```http
Status: 429 Too Many Requests

{
  "error": "Rate limit exceeded",
  "tokensRemaining": 0,
  "resetSeconds": 10,
  "rateLimitedAttempts": 3,
  "attemptsResetMinutes": 8,
  "warningMessage": "Warning: You have made 3 of 20 allowed attempts while rate limited. This counter resets in 8 minutes."
}
```

#### Blacklist Error
```http
Status: 403 Forbidden

{
  "error": "Account blacklisted",
  "reason": "Exceeded 20 attempts in 10 minutes while rate limited",
  "blacklistedUntil": "2025-06-13T12:45:30.000Z",
  "hoursRemaining": 24
}
```

### Admin Controls

#### Get All User Rate Limits
```http
GET /admin/rate-limits
Cookie: token=<jwt_token>
```

**Response:**
```json
{
  "settings": {
    "maxTokens": 100,
    "refillRatePerMinute": 10,
    "standardRequestCost": 1,
    "shortenUrlCost": 5,
    "blacklistThreshold": 20,
    "blacklistDurationHours": 24
  },
  "userRateLimits": [
    {
      "userId": "user123",
      "tokens": 95,
      "lastRefill": "2025-06-11T12:30:00.000Z"
    },
    {
      "userId": "user456",
      "tokens": 80,
      "lastRefill": "2025-06-11T12:25:00.000Z"
    }
  ]
}
```

#### Update Global Rate Limit Settings
```http
PUT /admin/rate-limits
Cookie: token=<jwt_token>
Content-Type: application/json

{
  "maxTokens": 200,
  "refillRatePerMinute": 20,
  "standardRequestCost": 1,
  "shortenUrlCost": 10,
  "blacklistThreshold": 30,
  "blacklistDurationHours": 12
}
```

#### Get Blacklisted Users
```http
GET /admin/blacklist
Cookie: token=<jwt_token>
```

#### Remove User from Blacklist
```http
DELETE /admin/blacklist/:userId
Cookie: token=<jwt_token>
```

## Token Bucket System

The URL Shortener API uses a token bucket algorithm for rate limiting instead of traditional time-based approaches:

- **Per-User Buckets**: Each user has their own token bucket with configurable capacity
- **Token Costs**: Different operations consume different numbers of tokens
  - Standard requests: 1 token
  - URL creation: 5 tokens
- **Automatic Refill**: Tokens automatically refill at a configurable rate (default: 10 tokens/minute)
- **Graduated Response**: Users receive warnings as they approach abuse thresholds
- **Configurable Thresholds**: All parameters can be adjusted by administrators

### Benefits of Token Bucket Rate Limiting:

- **Fair Resource Allocation**: Allows bursts of activity while maintaining average limits
- **Operation-Based Costs**: More resource-intensive operations cost more tokens
- **Transparent Warnings**: Users are informed of their remaining attempts before blacklisting
- **Fully Configurable**: System parameters can be adjusted for different traffic patterns

## System Architecture

- **Modular Route Structure**: Separate route handlers for authentication, API operations, and admin functions
- **Middleware Authentication**: JWT validation for protected routes using HTTP-only cookies
- **MongoDB Integration**: Persistent storage for users, URLs, rate limits, and blacklist records
- **Error Handling**: Centralized error management for consistent responses
- **Rate Limiting Middleware**: Token bucket implementation applied to all protected routes

### Models

- **URL**: Stores shortened URL data including original URL, short code, and visit page
- **User**: Manages user accounts, credentials, and role information
- **RateLimit**: Tracks token bucket state per user with token count and refill timestamp
- **Settings**: Global configuration for rate limits, token costs, and blacklist thresholds
- **Blacklist**: Tracks blacklisted users with timestamps and reason for blacklisting

### Middleware

- **rateLimiter**: Implements the token bucket algorithm for request throttling
- **auth**: Handles JWT authentication and role-based access control for protected routes

## Security

- **JWT Authentication**: Secure, token-based user authentication
- **HTTP-only Cookies**: Prevents client-side JavaScript from accessing authentication tokens
- **bcrypt Password Hashing**: Secure password storage with salt rounds
- **Rate Limiting**: Prevents brute force attacks and API abuse
- **Graduated Response**: Warning system before implementing penalties
- **Blacklisting**: Automatic blocking of abusive users with configurable duration
- **Role-based Access Control**: Strict separation between user and admin capabilities

#### Public Endpoints:
- `GET /health` - Health check endpoint returns 200 OK with timestamp

#### Authentication Endpoints:
- `POST /auth/register` - User registration creates account and returns user object
- `POST /auth/login` - User login sets HTTP-only cookie and returns profile data
- `POST /auth/admin/register` - Admin registration with valid key creates admin account
- `POST /auth/admin/login` - Admin login sets HTTP-only cookie with admin privileges
- `POST /auth/logout` - Successfully clears authentication cookie

#### URL Shortening Endpoints:
- `POST /api/shorten` - Creates short URL and deducts 5 tokens
- `GET /api/expand/:shortCode` - Resolves short URL to original URL
- `GET /api/visit/:shortCode` - Redirects to original URL with 302 Found status

#### Rate Limiting Functionality:
- `GET /api/rate-limit/status` - Returns correct token count and rate limit status
- Token bucket algorithm maintains correct token count across requests
- Rate limiting correctly blocks requests when tokens are exhausted
- Different token costs applied to different endpoint types
- Warning system correctly tracks and reports rate-limited attempts
- Blacklisting system activates after threshold is exceeded

#### Admin Endpoints:
- `GET /admin/rate-limits` - Returns all user rate limits and global settings
- `GET /admin/blacklist` - Returns list of blacklisted users
- `PUT /admin/rate-limits` - Updates global rate limit settings successfully
- `DELETE /admin/blacklist/:userId` - Successfully removes users from blacklist


## License

This project is licensed under the ISC License.

---

Created by Shashank Krishnaprasad
