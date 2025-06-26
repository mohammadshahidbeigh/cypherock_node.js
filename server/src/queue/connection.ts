import { RedisOptions } from 'ioredis';
import IORedis from 'ioredis';

export const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const queueName = 'provisioning';

// Function to test Redis connection
export const testRedisConnection = async () => {
  const client = new IORedis(redisOptions);
  try {
    await client.ping();
    console.log('✅ Redis connection successful');
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
  } finally {
    client.disconnect();
  }
}; 