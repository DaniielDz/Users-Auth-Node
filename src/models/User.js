import { pool } from '../config/db.js';

export const User = {
    async create (username, hashedPassword) {
        const [result] = await pool.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword]
        );
        return result
    },
    async findByUserName(username) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ?', [username]
        )

        return rows.length > 0 ? rows[0] : null
    }
}