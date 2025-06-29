import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { submitProvisioningJob } from './controllers/provisionController';
import { getJobStatus } from './controllers/statusController';
import { startWorker } from './queue/worker';
import { listenForProvisionRequests, writeProvisionResult, listenForSignupRequests, writeSignupResult, listenForLoginRequests, writeLoginResult, listenForAuthCheckRequests, writeAuthCheckResult } from './firebase/firestoreRelay';
import { provisionQueue, testRedisConnection } from './queue/provisionQueue';
import { QueueEvents } from 'bullmq';
import fs from 'fs';
import path from 'path';
import adminRoutes from './routes/admin';
import connectDB from './db';
import cookieParser from 'cookie-parser';
import { User } from './models/User';
import { comparePasswords, hashPassword } from './utils/hash';
import { generateToken, verifyToken } from './utils/jwt';

dotenv.config();
connectDB();


// Test Redis connection
testRedisConnection();

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));
app.use(helmet());
app.use(cookieParser());

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

app.use('/api/admin', adminRoutes);

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

// Add Firestore relay for signup
listenForSignupRequests(async (data, docId) => {
  const { email, password, confirmPassword } = data;
  if (!email || !password || !confirmPassword) {
    await writeSignupResult(docId, { message: 'All fields are required', status: 400 });
    return;
  }
  if (password !== confirmPassword) {
    await writeSignupResult(docId, { message: 'Passwords do not match', status: 400 });
    return;
  }
  if (password.length < 6) {
    await writeSignupResult(docId, { message: 'Password must be at least 6 characters', status: 400 });
    return;
  }
  const existing = await User.findOne({ email });
  if (existing) {
    await writeSignupResult(docId, { message: 'User already exists', status: 409 });
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, role: 'admin' });
  const token = generateToken({ id: user._id, role: user.role });
  await writeSignupResult(docId, { token, status: 201 });
});

// Add Firestore relay for login
listenForLoginRequests(async (data, docId) => {
  const { email, password } = data;
  const user = await User.findOne({ email });
  if (!user) {
    await writeLoginResult(docId, { message: 'Invalid credentials', status: 401 });
    return;
  }
  const match = await comparePasswords(password, user.passwordHash);
  if (!match) {
    await writeLoginResult(docId, { message: 'Invalid credentials', status: 401 });
    return;
  }
  const token = generateToken({ id: user._id, role: user.role });
  await writeLoginResult(docId, { token, status: 200 });
});

// Add Firestore relay for auth check
listenForAuthCheckRequests(async (data, docId) => {
  try {
    const { token } = data;
    if (!token) {
      await writeAuthCheckResult(docId, { valid: false, message: 'No token provided' });
      return;
    }
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      await writeAuthCheckResult(docId, { valid: false, message: 'User not found' });
      return;
    }
    await writeAuthCheckResult(docId, {
      valid: true,
      user: { id: user._id.toString(), email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('JWT verification failed:', err);
    console.log('Current JWT_SECRET:', process.env.JWT_SECRET);
    await writeAuthCheckResult(docId, { valid: false, message: 'Invalid or expired token' });
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 