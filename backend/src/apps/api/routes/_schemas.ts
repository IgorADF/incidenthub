import z from "zod";

export const serviceResponseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  url: z.string(),
  intervalSeconds: z.number().int(),
  timeoutSeconds: z.number().int(),
  expectedResponseStatus: z.number().int(),
  incidentDetectionFails: z.number().int(),
  emailToAlert: z.string().nullable(),
  enabled: z.boolean(),
  currentIncidentId: z.string().nullable(),
  createdAt: z.date(),
});
