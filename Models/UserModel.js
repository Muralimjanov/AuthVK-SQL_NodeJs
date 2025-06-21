import pool from './database.js';

export async function findUserByVkId(vk_id) {
    const [rows] = await pool.execute(
        'SELECT * FROM users WHERE vk_id = ?',
        [vk_id]
    );
    return rows[0] || null;
}

export async function createUser({ vk_id, full_name, role }) {
    const [result] = await pool.execute(
        'INSERT INTO users (vk_id, full_name, role) VALUES (?, ?, ?)',
        [vk_id, full_name, role]
    );
    return result.insertId;
}
