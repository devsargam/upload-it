import { createFactory } from 'hono/factory';
import type { AppEnv } from '@/types/app';

export const factory = createFactory<AppEnv>(); 