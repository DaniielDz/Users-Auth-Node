import { pool } from '../config/db.js';

export const User = {
    async create (email, hashedPassword) {
        const [result] = await pool.execute(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );
        return result
    },
    async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?', [email]
        )

        return rows.length > 0 ? rows[0] : null
    }
}