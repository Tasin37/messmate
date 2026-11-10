import { betterAuth } from 'better-auth';
import { getPool } from '../db/index.js';

export const auth = betterAuth({
  database: getPool(),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || 'development_secret_at_least_32_characters_long_for_auth',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
});
