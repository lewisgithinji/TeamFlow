import { z } from 'zod';
import { ProjectVisibility } from './enums';

// Create Project
export const createProjectSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  icon: z.string().max(10).optional(), // Emoji or short icon identifier
  visibility: ProjectVisibility.default('PUBLIC'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Update Project
export const updateProjectSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(10).optional().nullable(),
  visibility: ProjectVisibility.optional(),
  archived: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
