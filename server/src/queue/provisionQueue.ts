import { Queue } from 'bullmq';
import { redisOptions, queueName } from './connection';

export const provisionQueue = new Queue(queueName, { connection: redisOptions });

export { testRedisConnection } from './connection'; 