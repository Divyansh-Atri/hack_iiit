import { z } from 'zod';

export const createSessionSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1).max(200),
  createdBy: z.string().min(1),
});

export const verifyJoinCodeSchema = z.object({
  joinCode: z.string().length(6, 'Join code must be 6 characters'),
});

export const processSessionSchema = z.object({
  sessionId: z.string().min(1),
});

export const createClassSchema = z.object({
  name: z.string().min(1).max(200),
  instructor: z.string().min(1).max(200),
});
