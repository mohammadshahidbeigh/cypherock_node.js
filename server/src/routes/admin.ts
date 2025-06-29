import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { AuditLog } from '../models/AuditLog';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Dedicated endpoint for provisioned devices
router.get('/provisioned-devices', requireAuth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  const devices = await AuditLog.find({ action: 'Provisioned' }).sort({ timestamp: -1 });
  res.json({ devices });
});

// Admin-only route
router.get('/audit-logs', requireAuth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
  res.json({ logs });
});

router.post('/log-action', requireAuth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  const { deviceId, action } = req.body;
  await AuditLog.create({
    deviceId,
    action,
    operator: (req as any).user.id
  });
  res.status(201).json({ message: 'Logged' });
});

// Import provisionedDevices.json into AuditLog
router.post('/import-provisioned-devices', requireAuth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  const DEVICES_FILE = path.resolve(process.cwd(), 'provisionedDevices.json');
  if (!fs.existsSync(DEVICES_FILE)) {
    res.status(404).json({ message: 'provisionedDevices.json not found' });
    return;
  }
  const devices = JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf8'));
  const logs = devices.map((device: any) => ({
    deviceId: device.deviceInfo?.deviceId || 'unknown',
    action: 'Provisioned',
    timestamp: device.timestamp ? new Date(device.timestamp) : new Date(),
    operator: device.deviceInfo?.operator || 'unknown',
  }));
  await AuditLog.insertMany(logs);
  res.status(201).json({ message: 'Provisioned devices imported to audit logs', count: logs.length });
});

export default router; 