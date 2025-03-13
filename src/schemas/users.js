import { z } from "zod";

export const userSchema = z.object({
    username: z.string().nonempty(),
    password: z.string().min(6)
})
