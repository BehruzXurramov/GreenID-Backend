# GreenID Backend Frontend Integration Documentation

This document describes the backend API contract and behavior so you can implement the frontend safely.

## 1. Project Overview

GreenID backend is a NestJS API with:

- Google OAuth login
- JWT-based authorization
- Role-based access control (`user`, `admin`)
- Submission workflow where users submit before/after images and admins review them
- User points awarded by admins during review

Main domains:

- `auth`: Google OAuth + JWT token issuance
- `users`: current user and admin user listing
- `submissions`: create/list/review submissions

## 2. Tech Stack

- Framework: NestJS 11
- Language: TypeScript
- DB: PostgreSQL + TypeORM
- Auth: Passport (`passport-google-oauth20`, `passport-jwt`)
- Validation: `class-validator` + global `ValidationPipe`

## 3. Runtime and Global API Behavior

### 3.1 Base URL

- Production API (HTTPS): `https://bestapi.uz/greenid`
- Local API default: `http://localhost:3000/greenid`
- Port comes from `PORT` env var, default `3000`

### 3.2 Global middleware/pipes

- CORS is enabled globally with default Nest settings (`app.enableCors()`).
- Global `ValidationPipe` is enabled with:
  - `whitelist: true` (unknown fields are removed)
  - `forbidNonWhitelisted: true` (unknown fields also trigger 400)
  - `transform: true` (payload types can be transformed when possible)

### 3.3 Common response and error shape

- Success responses are plain JSON objects/arrays from controllers/services.
- Typical Nest validation/auth errors look like:

```json
{
  "statusCode": 400,
  "message": ["pointsGiven must not be less than 0"],
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

## 4. Authentication and Authorization

## 4.1 Auth model

- Login is done through Google OAuth.
- Backend creates/fetches a local user record.
- Backend returns an `accessToken` JWT and user payload.
- Protected endpoints require `Authorization: Bearer <token>`.

## 4.2 Roles

- `user`: default role
- `admin`: elevated role for listing all users, listing all submissions, and reviewing submissions

## 4.3 JWT payload

JWT contains:

```json
{
  "sub": "user-uuid",
  "role": "user"
}
```

`JwtStrategy` maps this to request user:

```json
{
  "userId": "user-uuid",
  "role": "user"
}
```

## 4.4 OAuth flow (frontend)

Recommended browser flow:

1. Frontend redirects browser to `GET /greenid/auth/google`.
2. User signs in on Google and consents.
3. Google redirects to backend callback URL (`/greenid/auth/google/callback`).
4. Backend responds with JSON:
   - `accessToken`
   - `user`

Important:

- Callback currently returns JSON directly, not a frontend redirect.
- If your frontend needs redirect-based token handoff, backend needs an additional redirect strategy (not currently implemented).
- For production, set Google OAuth redirect URI exactly to:
  - `https://bestapi.uz/greenid/auth/google/callback`

## 4.5 JWT expiration behavior

`JWT_EXPIRES_IN` is parsed using `parseInt(...)` before signing.

- You should set it as numeric seconds, for example:
  - `3600` (1 hour)
  - `86400` (1 day)
- If set to `1d`, `parseInt('1d', 10)` becomes `1`.

## 5. Data Models

## 5.1 User

```ts
type User = {
  id: string; // uuid
  googleId: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  points: number;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
};
```

DB details:

- Table: `users`
- Unique indexes: `googleId`, `email`

## 5.2 Submission

```ts
type Submission = {
  id: string; // uuid
  userId: string; // uuid
  beforeImage: string; // URL, max 500
  afterImage: string; // URL, max 500
  description: string; // max 3000
  adminDescription: string | null; // max 3000 if set
  status: 'pending' | 'approved';
  pointsGiven: number | null; // integer >= 0 once reviewed
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  user?: UserSummary; // included in admin list/review responses
};

type UserSummary = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  points: number;
};
```

DB details:

- Table: `submissions`
- Indexes: `userId`, `status`, `createdAt`
- Relation: many submissions to one user (`onDelete: CASCADE`)

## 6. API Endpoints

All endpoints are relative to base URL and include the global prefix `/greenid`.

## 6.1 Health

### `GET /greenid`

- Auth: none
- Response:

```json
{
  "status": "ok"
}
```

## 6.2 Auth

### `GET /greenid/auth/google`

- Auth: none
- Behavior: starts Google OAuth via Passport guard
- Frontend usage: full-page redirect (or popup window)

### `GET /greenid/auth/google/callback`

- Auth: none (Google guard-protected callback)
- Response:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "points": 0,
    "createdAt": "2026-03-04T06:00:00.000Z",
    "updatedAt": "2026-03-04T06:00:00.000Z"
  }
}
```

Possible errors:

- `401 Unauthorized` if Google profile data is invalid
- `401 Unauthorized` if email is already linked to another Google account

## 6.3 Users

### `GET /greenid/users/me`

- Auth: JWT required
- Role: any authenticated user
- Response: full user dto

### `GET /greenid/users`

- Auth: JWT required
- Role: `admin` only
- Response: `UserResponseDto[]`, sorted by `createdAt DESC`

## 6.4 Submissions

### `POST /greenid/submissions`

- Auth: JWT required
- Role: any authenticated user
- Body:

```json
{
  "beforeImage": "https://example.com/before.jpg",
  "afterImage": "https://example.com/after.jpg",
  "description": "Cleaned 2 bags of trash near the park."
}
```

Validation:

- `beforeImage`: required, non-empty string, valid `http/https` URL, max 500
- `afterImage`: required, non-empty string, valid `http/https` URL, max 500
- `description`: required string, max 3000

Response:

- Returns created submission
- `status` is always `pending`
- `pointsGiven` is `null`
- `adminDescription` is `null`

### `GET /greenid/submissions/my`

- Auth: JWT required
- Role: any authenticated user
- Response: current user's submissions
- Sorting: `createdAt DESC`
- `user` field is not included

### `GET /greenid/submissions`

- Auth: JWT required
- Role: `admin` only
- Response: all submissions
- Sorting: `createdAt DESC`
- Includes `user` summary object per submission

### `PATCH /greenid/submissions/:id`

- Auth: JWT required
- Role: `admin` only
- Params:
  - `id`: UUID (validated via `ParseUUIDPipe`)
- Body:

```json
{
  "pointsGiven": 25,
  "adminDescription": "Great work. Evidence is clear."
}
```

Validation:

- `pointsGiven`: required integer, minimum `0`
- `adminDescription`: optional string, max 3000

Behavior:

- Submission is set to `approved` (always).
- `pointsGiven` is stored on submission.
- User points are updated transactionally.
- If submission was previously `approved`, points are recalculated:
  - `user.points = user.points - previousPointsGiven + nextPointsGiven`
- If submission was not approved before:
  - `user.points += nextPointsGiven`
- If `adminDescription` is omitted, existing admin description remains unchanged.

Possible errors:

- `404 Submission not found`
- `404 User not found` (if relation is broken)
- `400` for invalid UUID or invalid body

## 7. Frontend DTO Contracts

Use these TypeScript types on frontend:

```ts
export type UserRole = 'user' | 'admin';
export type SubmissionStatus = 'pending' | 'approved';

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummaryDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points: number;
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserResponseDto;
}

export interface SubmissionResponseDto {
  id: string;
  userId: string;
  beforeImage: string;
  afterImage: string;
  description: string;
  adminDescription: string | null;
  status: SubmissionStatus;
  pointsGiven: number | null;
  createdAt: string;
  updatedAt: string;
  user?: UserSummaryDto;
}

export interface CreateSubmissionDto {
  beforeImage: string;
  afterImage: string;
  description: string;
}

export interface UpdateSubmissionAdminDto {
  pointsGiven: number;
  adminDescription?: string;
}
```

## 8. Frontend Integration Checklist

## 8.1 Environment

Set frontend env variables:

- `VITE_API_BASE_URL` (or equivalent): backend API base URL, for example `https://bestapi.uz/greenid`
- `GOOGLE_LOGIN_URL`: `${API_BASE_URL}/auth/google`

## 8.2 Token handling

- Save `accessToken` after successful login callback.
- Send on protected calls:
  - `Authorization: Bearer <token>`
- Handle `401` globally by clearing session and redirecting to login.

## 8.3 Role-based UI

- Check `user.role` in auth state.
- Hide admin pages/actions for non-admin users:
  - Users list
  - All submissions list
  - Review submission action

## 8.4 Submission UX suggestions

- Validate URL inputs client-side before POST.
- Show `pending` and `approved` badges.
- Display `pointsGiven` only when not `null`.
- Show admin feedback (`adminDescription`) if present.

## 9. Required Backend Environment Variables

From validation schema and example env:

- `NODE_ENV` (`development|test|production`, default `development`)
- `PORT` (default `3000`)
- `DB_HOST` (required)
- `DB_PORT` (default `5432`)
- `DB_USERNAME` (required)
- `DB_PASSWORD` (required, can be empty string)
- `DB_NAME` (required)
- `DB_SYNC` (default `false`)
- `JWT_SECRET` (required)
- `JWT_EXPIRES_IN` (default string is `1d`, but numeric seconds are safer due to parse behavior)
- `GOOGLE_CLIENT_ID` (required)
- `GOOGLE_CLIENT_SECRET` (required)
- `GOOGLE_CALLBACK_URL` (required, valid URI)
  - Production value: `https://bestapi.uz/greenid/auth/google/callback`

## 10. Endpoint Matrix (Quick View)

| Method | Path | Auth | Role | Notes |
|---|---|---|---|---|
| GET | `/greenid` | No | Public | Health check |
| GET | `/greenid/auth/google` | No | Public | Starts OAuth |
| GET | `/greenid/auth/google/callback` | No | Public | Returns token + user |
| GET | `/greenid/users/me` | Yes | Any authenticated | Current user |
| GET | `/greenid/users` | Yes | Admin | All users |
| POST | `/greenid/submissions` | Yes | Any authenticated | Create submission |
| GET | `/greenid/submissions/my` | Yes | Any authenticated | Current user's submissions |
| GET | `/greenid/submissions` | Yes | Admin | All submissions + user summary |
| PATCH | `/greenid/submissions/:id` | Yes | Admin | Approve/re-score submission |
