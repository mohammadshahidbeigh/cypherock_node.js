import { v4 as uuidv4 } from 'uuid';
import { provisionQueue } from '../queue/provisionQueue';
import { Request, Response } from 'express';

export const submitProvisioningJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = uuidv4();
    const { publicKey, deviceInfo } = req.body;
    // Input validation
    if (typeof publicKey !== 'string' || !publicKey.trim()) {
      res.status(400).json({ error: 'Invalid or missing publicKey' });
      return;
    }
    if (typeof deviceInfo !== 'object' || deviceInfo === null || Array.isArray(deviceInfo)) {
      res.status(400).json({ error: 'Invalid or missing deviceInfo' });
      return;
    }
    await provisionQueue.add('provision-job', { publicKey, deviceInfo }, { jobId });
    res.json({ jobId });
  } catch (err) {
    console.error('Error in submitProvisioningJob:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 