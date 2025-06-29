import { Worker } from 'bullmq';
import { redisOptions, queueName } from './connection';
import { MockHSM } from '../hsm/MockHSM';
import crypto from 'crypto';
import { AuditLog } from '../models/AuditLog';
import admin from '../firebase/admin';

const hsm = new MockHSM();
const db = admin.firestore();

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
        action: 'Provisioned',
        status: 'completed',
        signedCertificate: signature.toString('base64'),
      };

      // 5. Save to AuditLog in MongoDB only, with status and signedCertificate
      await AuditLog.create({
        deviceId: deviceInfo?.deviceId || 'unknown',
        action: 'Provisioned',
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
        operator: deviceInfo?.operator || 'unknown',
        status: 'completed',
        signedCertificate: signature.toString('base64'),
      });

      // 6. Also write to Firestore for dashboard
      console.log('Writing to Firestore provisioned_devices:', record);
      await db.collection('provisioned_devices').add(record);
      console.log('Successfully wrote to Firestore provisioned_devices');

      return { ...record };
    },
    { connection: redisOptions }
  );
  worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
}; 