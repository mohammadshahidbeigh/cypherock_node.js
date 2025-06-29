# API Overview

This backend exposes the following integration points:

## Firestore Relay Collections (Recommended)
- `provision_requests` / `provision_responses`
- `signup_requests` / `signup_responses`
- `login_requests` / `login_responses`
- `auth_check_requests` / `auth_check_responses`

See below for request/response formats and usage.

## Legacy REST Endpoints (Deprecated)
- `POST /provision-requests`
- `GET /status/:jobId`
- `GET /provisioned-devices`

---

# Cypherock Provisioning Server – API & Firestore Relay Documentation

This document describes the Firestore relay collections and (legacy) REST API endpoints exposed by the Cypherock provisioning backend.

---

## Firestore Relay Collections (Recommended)

### 1. Provisioning
- **Requests:** `provision_requests` (Firestore collection)
- **Responses:** `provision_responses` (Firestore collection)
- **How it works:**
  - Client writes a document to `provision_requests` with device info and public key.
  - Server processes the request, signs the payload, and writes the result to `provision_responses` with the same document ID.

#### Example Request Document (provision_requests):
```json
{
  "publicKey": "<device public key>",
  "deviceInfo": { /* device metadata */ }
}
```
#### Example Response Document (provision_responses):
```json
{
  "deviceInfo": { /* device metadata */ },
  "publicKey": "...",
  "timestamp": "...",
  "signature": "...",
  "action": "Provisioned",
  "status": "completed",
  "signedCertificate": "..."
}
```

### 2. Signup & Login
- **Signup:**
  - Requests: `signup_requests`
  - Responses: `signup_responses`
- **Login:**
  - Requests: `login_requests`
  - Responses: `login_responses`
- **How it works:**
  - Client writes signup/login data to the respective request collection.
  - Server processes and writes result (token, status, or error) to the response collection with the same document ID.

#### Example Signup/Login Response:
```json
{
  "token": "<JWT token>",
  "status": 201
}
```

### 3. Auth Check
- **Requests:** `auth_check_requests`
- **Responses:** `auth_check_responses`
- **How it works:**
  - Client writes `{ token }` to `auth_check_requests`.
  - Server verifies the JWT and writes `{ valid, user, message }` to `auth_check_responses`.

#### Example Auth Check Response:
```json
{
  "valid": true,
  "user": { "id": "...", "email": "...", "role": "..." }
}
```

---

## Legacy REST API Endpoints (Deprecated)

### 1. Submit Provisioning Request
- **Endpoint:** `POST /provision-requests`
- **Description:** (Deprecated) Use Firestore relay instead.

### 2. Get Provisioning Status
- **Endpoint:** `GET /status/:jobId`
- **Description:** (Deprecated) Use Firestore relay instead.

### 3. List Provisioned Devices
- **Endpoint:** `GET /provisioned-devices`
- **Description:** (Deprecated) Use Firestore relay instead. (May return empty if not used.)

---

## Error Handling
- All Firestore relay responses include a `status` or `message` field describing the result or error.

---

## Notes
- All Firestore relay collections expect and return JSON-compatible data.
- The server must be running and connected to Firebase for relay to work.
- For cloud integration, see the Firestore relay logic in the backend source code. 