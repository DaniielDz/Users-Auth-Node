import { userSchema } from "../schemas/users.js";

const validateUser = (input) => {
    return userSchema.safeParse(input);
}

// en caso de que se quiera editar un usuario, se puede usar este validador
const validatePartialUser = (input) => {
    return userSchema.partial().safeParse(input);
}

export { validateUser, validatePartialUser };