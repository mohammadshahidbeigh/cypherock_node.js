import { provisionQueue } from '../queue/provisionQueue';
import { Request, Response } from 'express';

export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    if (typeof jobId !== 'string' || !jobId.trim()) {
      res.status(400).json({ error: 'Invalid or missing jobId' });
      return;
    }
    const job = await provisionQueue.getJob(jobId);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    const state = await job.getState();
    res.json({ status: state, returnvalue: job.returnvalue || null });
  } catch (err) {
    console.error('Error in getJobStatus:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 