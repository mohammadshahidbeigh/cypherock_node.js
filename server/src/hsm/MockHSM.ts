import crypto from 'crypto';
import { IHSM } from './IHSM';

export class MockHSM implements IHSM {
  private privateKey: crypto.KeyObject;

  constructor() {
    // For test/dev: generate a new key each time (ephemeral)
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    this.privateKey = privateKey;
    // Log the public key in PEM format
    console.log('MockHSM public key (PEM):\n', publicKey.export({ type: 'pkcs1', format: 'pem' }));
  }

  async signCertificate(data: Buffer): Promise<Buffer> {
    return crypto.sign('sha256', data, this.privateKey);
  }
} 