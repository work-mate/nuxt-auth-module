import { z } from "zod";

export default defineNitroPlugin(() => {
  defineAuthEndpointSchemas({
    signIn: z.object({
      email_address: z.email(),
      password: z.string().min(8),
    }),
  });
});
