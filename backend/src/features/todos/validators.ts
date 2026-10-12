import { z } from 'zod';

export const titleSchema = z.string().trim().min(1).max(120);

export const createSchema = z.strictObject({
  title: titleSchema,
  completed: z.boolean().default(false),
});
