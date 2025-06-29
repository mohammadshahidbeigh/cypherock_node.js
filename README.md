# Cypherock Provisioning Server

## Overview
This backend service manages secure device provisioning for Cypherock hardware wallets. It handles device registration, certificate signing (via a mock HSM), and status tracking, using a queue-based architecture for scalability and reliability. The system integrates with Firebase for cloud relay and uses Redis for job queueing.

### Key Features
- **Firestore Relay** for device provisioning, authentication, and admin actions (recommended)
- **REST API** (legacy, deprecated) for device provisioning and status queries
- **Job Queue** (BullMQ + Redis) for scalable, asynchronous processing
- **Mock HSM** for cryptographic signing (replaceable with real HSM)
- **Persistent device registry** in `provisionedDevices.json` (legacy)

---

## Architecture & Data Flow

```mermaid
graph TD;
  A[Client/Cloud] -- Firestore Relay --> F[Firebase]
  F -- Firestore --> B[Express Server]
  B -- Queue --> C[Provision Queue (Redis)]
  C -- Worker --> D[Mock HSM]
  D -- Signed Certificate --> B
  B -- Firestore --> F
  B -- Audit Log --> G[MongoDB]
  Admin[Admin Dashboard] -- Firestore --> F
```

### Flow Description
- **Provisioning, signup, login, and auth check** requests are sent via Firestore collections.
- **Server** listens to Firestore, processes requests, and writes results back to Firestore.
- **Worker** processes jobs: builds payload, hashes, signs with Mock HSM, stores result.
- **Results** are written to Firestore and optionally to local JSON/MongoDB for auditing.
- **Status** and **device list** are available via Firestore relay.

#### Key Challenges Addressed
- **Scalability:** Decoupled queue/worker model for high throughput.
- **Security:** HSM abstraction for cryptographic operations.
- **Reliability:** Persistent device registry and job status tracking.
- **Cloud Integration:** Firestore relay for remote provisioning and admin actions.

---

## Key Challenges & Architectural Choices

### Provable Identity
Each device receives a unique, cryptographically signed certificate from the HSM (or MockHSM), allowing it to prove its legitimacy in the field.

### Concurrency vs. Sequential HSM
The backend uses a job queue (BullMQ + Redis) to serialize access to the HSM, ensuring only one cryptographic operation occurs at a time, while still accepting concurrent requests.

### Network Architecture
To bridge the untrusted factory network and the secure on-premise backend (which cannot accept direct incoming connections), the system uses Firestore relay. Both client and server communicate via Firestore collections, eliminating the need for static IPs or open inbound ports.

### Hardware Abstraction
The cryptographic signing logic is abstracted behind an IHSM interface, allowing seamless swapping between a MockHSM (for development) and a real HSM (for production) without changing core logic.

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
JWT_SECRET= ' '
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

## Firestore Relay Collections (Recommended)

### 1. Provisioning
- **Requests:** `provision_requests` (Firestore collection)
- **Responses:** `provision_responses` (Firestore collection)
- **How it works:**
  - Client writes a document to `provision_requests` with device info and public key.
  - Server processes the request, signs the payload, and writes the result to `provision_responses` with the same document ID.

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

### 3. Auth Check
- **Requests:** `auth_check_requests`
- **Responses:** `auth_check_responses`
- **How it works:**
  - Client writes `{ token }` to `auth_check_requests`.
  - Server verifies the JWT and writes `{ valid, user, message }` to `auth_check_responses`.

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

## Development Notes
- **HSM:** Uses a mock HSM for signing. Replace with a real HSM for production.
- **Persistence:** Device records are stored in `provisionedDevices.json` in the server root (legacy).
- **Queue:** Uses BullMQ and Redis for job management.

---

## License
MIT 

---

## Running the System Locally

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd cypherock_node.js/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the required values (see Configuration section above).

4. Start Redis (required for the job queue):
   - If you have Docker: `docker run -p 6379:6379 redis`
   - Or install Redis locally.

5. Start the server:
   ```bash
   npm run dev
   ```

6. (Optional) Start the frontend (if available):
   ```bash
   cd ../client
   npm install
   npm start
   ```

7. Use the Firestore relay collections to interact with the backend as described above. 