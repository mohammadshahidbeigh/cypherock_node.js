# Cypherock Provisioning Server

## Overview
This backend service manages secure device provisioning for Cypherock hardware wallets. It handles device registration, certificate signing (via a mock HSM), and status tracking, using a queue-based architecture for scalability and reliability. The system integrates with Firebase for cloud relay and uses Redis for job queueing.

### Key Features
- **REST API** for device provisioning and status queries
- **Job Queue** (BullMQ + Redis) for scalable, asynchronous processing
- **Mock HSM** for cryptographic signing (replaceable with real HSM)
- **Firebase Firestore Relay** for cloud-based provisioning requests/results
- **Persistent device registry** in `provisionedDevices.json`

---

## Architecture & Data Flow

```mermaid
graph TD;
  A[Client/Cloud] -- REST/Firestore --> B[Express Server]
  B -- POST /provision-requests --> C[Provision Queue (Redis)]
  C -- Worker --> D[Mock HSM]
  D -- Signed Certificate --> E[provisionedDevices.json]
  C -- Status/Result --> B
  B -- GET /status/:jobId --> C
  B -- GET /provisioned-devices --> E
  B -- Firestore Relay --> F[Firebase]
```

### Flow Description
- **Provisioning requests** arrive via REST API or Firebase Firestore.
- **Requests** are enqueued in Redis (BullMQ).
- **Worker** processes jobs: builds payload, hashes, signs with Mock HSM, stores result.
- **Results** are written to local JSON and optionally relayed back to Firestore.
- **Status** and **device list** are available via API.

#### Key Challenges Addressed
- **Scalability:** Decoupled queue/worker model for high throughput.
- **Security:** HSM abstraction for cryptographic operations.
- **Reliability:** Persistent device registry and job status tracking.
- **Cloud Integration:** Firebase relay for remote provisioning.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Redis](https://redis.io/) (local or remote instance)

### Installation
```bash
cd server
npm install
```

### Configuration
Create a `.env` file in the `server` directory (optional, defaults shown):
```
PORT=3000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
FRONTEND_URL=http://localhost:5173
FIREBASE_PROJECT_ID= ' '
FIREBASE_CLIENT_EMAIL= ' '
FIREBASE_PRIVATE_KEY= ' '
```

### Running the Server
- **Development (with hot reload):**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm start
  ```

The server will start on `http://localhost:3000` (or your configured port).

---

## API Documentation

### 1. Submit Provisioning Request
- **Endpoint:** `POST /provision-requests`
- **Description:** Enqueue a new device provisioning job.
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
- **Errors:** 400 (invalid input), 500 (server error)

### 2. Get Provisioning Status
- **Endpoint:** `GET /status/:jobId`
- **Description:** Get the status and result of a provisioning job.
- **Response:**
  ```json
  {
    "status": "completed|waiting|failed|...",
    "returnvalue": { /* result or null */ }
  }
  ```
- **Errors:** 400 (invalid jobId), 404 (not found), 500 (server error)

### 3. List Provisioned Devices
- **Endpoint:** `GET /provisioned-devices`
- **Description:** Get all provisioned device records.
- **Response:** Array of device records (from `provisionedDevices.json`).

---

## Firebase Relay (Cloud Integration)
- The server listens to Firestore `provision_requests` collection for new jobs.
- Results are written to `provision_responses` collection.
- Configure Firebase credentials in `src/firebase/firestoreRelay.ts` as needed.

---

## Development Notes
- **HSM:** Uses a mock HSM for signing. Replace with a real HSM for production.
- **Persistence:** Device records are stored in `provisionedDevices.json` in the server root.
- **Queue:** Uses BullMQ and Redis for job management.

---

## License
MIT 