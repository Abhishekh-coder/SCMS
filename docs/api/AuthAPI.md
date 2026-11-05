# 🌐 CCMS Authentication & Identity API Specifications (v1.0)

---

## 1. Registration Endpoint: `POST /api/v1/auth/register`

- **Description**: Registers a new campus identity (`STUDENT` or `FACULTY`), generates a profile, hashes the password via Bcrypt (cost factor 12), initializes a multi-purpose OTP entry, and publishes a decoupled `UserRegistered` domain event.
- **Account State**: Account is set to `PENDING_VERIFICATION`.

### Request Body Example
```json
{
  "fullName": "Ananya Verma",
  "email": "ananya.verma@campus.edu",
  "password": "your-strong-password",
  "phone": "+919876543210",
  "role": "STUDENT",
  "profileDetails": {
    "rollNumber": "CS2026099",
    "semester": 4,
    "branch": "CSE",
    "hostelBlock": "G-1",
    "roomNumber": "104"
  },
  "recaptchaToken": "03AFcWeA7..."
}
```

### Standardized Success Response (HTTP 201 Created)
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email with the OTP sent.",
  "data": {
    "userUuid": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "userCode": "STU-802143",
    "email": "ananya.verma@campus.edu",
    "accountStatus": "PENDING_VERIFICATION"
  },
  "meta": {
    "requestId": "req_801923841",
    "timestamp": "2026-08-03T18:52:00.000Z"
  }
}
```

---

## 2. Login Endpoint: `POST /api/v1/auth/login`

- **Description**: Authenticates user credentials via `AuthenticationPipeline`, validates account status (`ACTIVE`), verifies reCAPTCHA, initializes session, issues Dual JWT Tokens, and ingests `ReportingLoginFact` to Power BI.

### Request Body Example
```json
{
  "email": "ananya.verma@campus.edu",
  "password": "your-strong-password",
  "recaptchaToken": "03AFcWeA7..."
}
```

### Standardized Success Response (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Authentication successful.",
  "data": {
    "user": {
      "userUuid": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "userCode": "STU-802143",
      "fullName": "Ananya Verma",
      "email": "ananya.verma@campus.edu",
      "roles": ["STUDENT"]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    },
    "sessionId": "sess_901283-912"
  },
  "meta": {
    "requestId": "req_90123891",
    "timestamp": "2026-08-03T18:55:00.000Z"
  }
}
```

---

## 3. Token Rotation Endpoint: `POST /api/v1/auth/refresh`

- **Description**: Rotates Refresh Token family. Detects token reuse replay attacks and revokes the entire token family if a previously used token is presented.

### Request Body Example
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Standardized Success Response (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Token rotated successfully.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  },
  "meta": {
    "requestId": "req_90123892",
    "timestamp": "2026-08-03T18:55:05.000Z"
  }
}
```

---

## 4. Me Profile Endpoint: `GET /api/v1/auth/me`

- **Description**: Protected endpoint returning authenticated user identity & active session metadata.

### Headers Required
- `Authorization`: `Bearer <accessToken>`

### Standardized Success Response (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Current authenticated user profile retrieved.",
  "data": {
    "user": {
      "userUuid": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "userCode": "STU-802143",
      "fullName": "Ananya Verma",
      "email": "ananya.verma@campus.edu",
      "roles": ["STUDENT"],
      "accountStatus": "ACTIVE"
    },
    "session": {
      "sessionUuid": "sess_901283-912",
      "browser": "Chrome",
      "OS": "Windows",
      "ipAddress": "127.0.0.1"
    }
  }
}
```

---

## 5. Logout Endpoint: `POST /api/v1/auth/logout`

- **Description**: Revokes current device session and refresh token family.
