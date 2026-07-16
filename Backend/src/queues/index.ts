import { Queue, Worker } from 'bullmq';
import { config } from '../config';

// Queue names
export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  STREAK_CALCULATION: 'streak-calculation',
  EMAIL: 'email',
  PAYMENT_PROCESSING: 'payment-processing',
} as const;

// Connection options for BullMQ
const connectionOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: 3,
};

// Create queues
export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, { connection: connectionOptions });
export const streakQueue = new Queue(QUEUE_NAMES.STREAK_CALCULATION, { connection: connectionOptions });
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection: connectionOptions });
export const paymentQueue = new Queue(QUEUE_NAMES.PAYMENT_PROCESSING, { connection: connectionOptions });

export type VerificationEmailJob = {
  type: 'verification';
  to: string;
  userId: string;
  token: string;
  expiresAt: string;
};

export type PasswordResetEmailJob = {
  type: 'password-reset';
  to: string;
  userId: string;
  token: string;
  expiresAt: string;
};

export type EmailJobData = VerificationEmailJob | PasswordResetEmailJob;

const emailJobOptions = {
  attempts: 3,
  removeOnComplete: true,
  removeOnFail: 100,
};

export const queueVerificationEmail = (data: Omit<VerificationEmailJob, 'type'>) => {
  return emailQueue.add('send-verification-email', { type: 'verification', ...data }, emailJobOptions);
};

export const queuePasswordResetEmail = (data: Omit<PasswordResetEmailJob, 'type'>) => {
  return emailQueue.add('send-password-reset-email', { type: 'password-reset', ...data }, emailJobOptions);
};

// Worker factory function
export const createWorker = (
  queueName: string,
  processor: (job: any) => Promise<void>,
  options?: any
): Worker => {
  return new Worker(queueName, processor, {
    connection: connectionOptions,
    concurrency: 5,
    ...options,
  });
};
