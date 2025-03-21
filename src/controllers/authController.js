import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { User } from "../models/User.js";
import { validateUser } from "../utils/validateUser.js";

export class AuthController {
    static async register(req, res) {
        try {
            const { username, password } = req.body

            const result = validateUser({ username, password })

            if (!result.success) {
                return res.status(400).json({ message: 'Datos inválidos', errors: result.error.errors })
            }

            const existingUser = await User.findByUserName(username)

            if (existingUser) {
                return res.status(400).json({ message: `El username ${username} ya está registrado` })
            }

            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await User.create(username, hashedPassword);

            const token = jwt.sign(
                { id: newUser.id, username: newUser.username },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
            
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            res.status(201).json({
                message: 'Usuario registrado y autenticado con éxito',
                user: newUser.username
            });
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error })
        }
    }

    static async login(req, res) {
        try {
            const { username, password } = req.body

            const result = validateUser({ username, password })

            if (!result.success) {
                return res.status(400).json({ message: 'Datos inválidos', errors: result.error.errors })
            }

            const user = await User.findByUserName(username)
            if (!user) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash)

            if (!isMatch) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            )

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            })

            res.json({ message: 'Login exitoso', user: username });
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }

    static async logout(req, res) {
        res.clearCookie('token');
        res.json({ message: 'Logout exitoso' });
    };
}