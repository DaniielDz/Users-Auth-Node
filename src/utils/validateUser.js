import { userSchema } from "../schemas/users.js";

const validateUser = (input) => {
    return userSchema.safeParse(input);
}

export { validateUser };