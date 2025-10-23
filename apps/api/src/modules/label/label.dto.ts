import { z } from 'zod';

/**
 * Schema for creating a label
 */
export const CreateLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50, 'Label name must be 50 characters or less'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)'),
});

/**
 * Schema for updating a label
 */
export const UpdateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Type exports
export type CreateLabelDto = z.infer<typeof CreateLabelSchema>;
export type UpdateLabelDto = z.infer<typeof UpdateLabelSchema>;
