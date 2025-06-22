import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /*
   * Server-side Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    // JWT Secret for authentication
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    
    // Resend Email API Configuration
    RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
    RESEND_FROM_EMAIL: z.string().email("RESEND_FROM_EMAIL must be a valid email"),
    
    // R2 (Cloudflare Object Storage) Configuration
    R2_ENDPOINT: z.string().url("R2_ENDPOINT must be a valid URL"),
    R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
    R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
    R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required").default("upload-it"),
  },

  /*
   * Environment variables available on the client (and server).
   */
  client: {},
  
  /*
   * Prefix for client-side environment variables
   */
  clientPrefix: "PUBLIC_",

  /*
   * Due to how Next.js (and Vite) bundles environment variables on the client,
   * we need to manually destructure them from `process.env` in order for the
   * bundler to detect that they are being used.
   */
  runtimeEnv: {
    // Server-side variables
    JWT_SECRET: process.env.JWT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  },

  /*
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a string, it will fail validation. This is intentional.
   *
   * If you want to allow empty strings, you can use the `optional` validator:
   * z.string().optional()
   *
   * Read more about the available validators:
   * https://zod.dev/?id=primitives
   */
  emptyStringAsUndefined: true,
});

// Type-safe access to environment variables
export type Env = typeof env;
