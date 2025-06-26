import { Worker } from 'bullmq';
import { redisOptions, queueName } from './connection';
import { MockHSM } from '../hsm/MockHSM';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const hsm = new MockHSM();
const DEVICES_FILE = path.resolve(process.cwd(), 'provisionedDevices.json');

function saveProvisionedDevice(deviceRecord: any) {
  console.log('Saving devices to:', DEVICES_FILE);
  let devices = [];
  if (fs.existsSync(DEVICES_FILE)) {
    devices = JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf8'));
  }
  devices.push(deviceRecord);
  fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
}

export const startWorker = () => {
  const worker = new Worker(
    queueName,
    async (job) => {
      const { publicKey, deviceInfo } = job.data;

      // 1. Build a structured payload
      const payload = {
        deviceInfo,
        publicKey,
        timestamp: new Date().toISOString(),
      };

      // 2. Serialize and hash the payload
      const payloadString = JSON.stringify(payload);
      const payloadHash = crypto.createHash('sha256').update(payloadString).digest();

      // 3. Sign the hash with the HSM
      const signature = await hsm.signCertificate(payloadHash);

      // 4. Store and return the payload and signature
      const record = {
        ...payload,
        signature: signature.toString('base64'),
      };
      saveProvisionedDevice(record);
      return { ...record };
    },
    { connection: redisOptions }
  );
  worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
}; 