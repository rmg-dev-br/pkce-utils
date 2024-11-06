import z from 'zod'

export const authSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(), // Seconds
  id_token: z.string(),
  refresh_token: z.string(),
  token_type: z.enum(['Bearer']),
});

export type Auth = z.infer<typeof authSchema>
