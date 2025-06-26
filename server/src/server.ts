import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { submitProvisioningJob } from './controllers/provisionController';
import { getJobStatus } from './controllers/statusController';
import { startWorker } from './queue/worker';
import { listenForProvisionRequests, writeProvisionResult } from './firebase/firestoreRelay';
import { provisionQueue, testRedisConnection } from './queue/provisionQueue';
import { QueueEvents } from 'bullmq';
import fs from 'fs';
import path from 'path';

dotenv.config();

testRedisConnection();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(helmet());

app.post('/provision-requests', submitProvisioningJob);
app.get('/status/:jobId', getJobStatus);
app.get('/provisioned-devices', (req: Request, res: Response) => {
  const DEVICES_FILE = path.resolve(process.cwd(), 'provisionedDevices.json');
  console.log('Reading devices from:', DEVICES_FILE);
  if (!fs.existsSync(DEVICES_FILE)) {
    res.json([]);
    return;
  }
  const devices = JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf8'));
  res.json(devices);
});

startWorker();

// Create a QueueEvents instance for waitUntilFinished
const queueEvents = new QueueEvents('provisioning', { connection: { host: process.env.REDIS_HOST || '127.0.0.1', port: Number(process.env.REDIS_PORT) || 6379 } });

// Listen to Firebase relay and enqueue jobs
listenForProvisionRequests(async (data, docId) => {
  // Enqueue job, then write result back to Firestore when done
  const job = await provisionQueue.add('provision-job', data, { jobId: docId });
  job.waitUntilFinished(queueEvents).then(result => {
    writeProvisionResult(docId, result);
  });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 