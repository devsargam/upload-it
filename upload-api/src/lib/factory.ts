import { createFactory } from 'hono/factory';
import { AppEnv } from '@/types/app';

export const factory = createFactory<AppEnv>();         