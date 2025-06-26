# Cypherock Provisioning Server – API Documentation

This document describes the REST API endpoints exposed by the Cypherock provisioning backend.

---

## 1. Submit Provisioning Request
- **Endpoint:** `POST /provision-requests`
- **Description:** Enqueue a new device provisioning job. Returns a job ID for status tracking.
- **Request Body:**
  ```json
  {
    "publicKey": "<device public key>",
    "deviceInfo": { /* object with device metadata */ }
  }
  ```
- **Response:**
  ```json
  { "jobId": "<job id>" }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid or missing `publicKey` or `deviceInfo`.
  - `500 Internal Server Error`: Unexpected server error.

---

## 2. Get Provisioning Status
- **Endpoint:** `GET /status/:jobId`
- **Description:** Get the status and result of a provisioning job by its job ID.
- **URL Parameter:**
  - `jobId` (string): The job identifier returned by the provisioning request.
- **Response:**
  ```json
  {
    "status": "completed|waiting|failed|...",
    "returnvalue": { /* result object or null */ }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid or missing `jobId`.
  - `404 Not Found`: Job not found.
  - `500 Internal Server Error`: Unexpected server error.

---

## 3. List Provisioned Devices
- **Endpoint:** `GET /provisioned-devices`
- **Description:** Retrieve all provisioned device records stored on the server.
- **Response:**
  ```json
  [
    {
      "deviceInfo": { /* device metadata */ },
      "publicKey": "...",
      "timestamp": "...",
      "signature": "..."
    },
    // ... more devices
  ]
  ```
- **Error Responses:**
  - Returns an empty array if no devices are provisioned.

---

## Error Handling
- All error responses are JSON objects with an `error` field describing the issue.
- Example:
  ```json
  { "error": "Invalid or missing publicKey" }
  ```

---

## Notes
- All endpoints expect and return `application/json`.
- The server must be running and accessible at the configured host/port (default: `http://localhost:3000`).
- For cloud integration, see the Firebase relay logic in the backend source code. 