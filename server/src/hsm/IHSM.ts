export interface IHSM {
  signCertificate(data: Buffer): Promise<Buffer>;
} 